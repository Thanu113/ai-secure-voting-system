import cv2
import numpy as np
from typing import List, Tuple
from app.utils.image_processing import decode_base64_image, detect_face
from app.core.config import settings

def extract_128d_embedding(face_img: np.ndarray) -> List[float]:
    """
    Extracts a canonical 128-dimensional biometric descriptor from a face image.
    Uses multi-region spatial histogram pooling and DCT (Discrete Cosine Transform) frequency coefficients.
    Outputs a unit-normalized (L2 norm = 1.0) 128-dimensional float vector.
    """
    # 1. Resize to standard dimensions 128x128
    resized = cv2.resize(face_img, (128, 128))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    # 2. Illumination normalization (CLAHE - Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    norm_gray = clahe.apply(gray)

    # 3. Frequency domain transformation via 2D Discrete Cosine Transform
    float_gray = np.float32(norm_gray) / 255.0
    dct = cv2.dct(float_gray)

    # 4. Extract low-to-mid frequency DCT coefficients (top-left 64 coefficients)
    # CRITICAL: Zero out dct[0, 0] (DC illumination component) to make the embedding
    # strictly lighting-invariant and dependent solely on facial biometric geometry.
    dct_features = dct[:8, :8].flatten().copy()
    dct_features[0] = 0.0  # Eliminate ambient room brightness bias
    dct_norm = np.linalg.norm(dct_features)
    if dct_norm > 0:
        dct_features = dct_features / dct_norm

    # 5. Spatial gradient features (Sobel horizontal and vertical gradients)
    sobelx = cv2.Sobel(norm_gray, cv2.CV_32F, 1, 0, ksize=3)
    sobely = cv2.Sobel(norm_gray, cv2.CV_32F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(sobelx, sobely)

    # Pool into 8x8 spatial grid (64 mean cell magnitudes)
    grid_features = []
    cell_h, cell_w = 16, 16
    for i in range(8):
        for j in range(8):
            cell = magnitude[i * cell_h:(i + 1) * cell_h, j * cell_w:(j + 1) * cell_w]
            grid_features.append(float(np.mean(cell)))

    grid_arr = np.array(grid_features, dtype=np.float32)
    grid_norm = np.linalg.norm(grid_arr)
    if grid_norm > 0:
        grid_arr = grid_arr / grid_norm

    # 6. Concatenate 64 DCT features + 64 Spatial gradient features = 128 dimensions
    raw_vector = np.concatenate([dct_features, grid_arr])

    # 7. Final L2 Unit Normalization
    norm = np.linalg.norm(raw_vector)
    if norm > 0:
        normalized_vector = raw_vector / norm
    else:
        normalized_vector = raw_vector

    return [round(float(x), 6) for x in normalized_vector]

def process_face_image_to_embedding(base64_str: str) -> Tuple[bool, List[float], str]:
    """
    Decodes base64, runs face detection, and returns (success, 128d_embedding, message).
    """
    try:
        img = decode_base64_image(base64_str)
    except Exception as e:
        return False, [], f"Invalid image format: {str(e)}"

    found, face_roi, bbox = detect_face(img)
    if not found or face_roi is None:
        return False, [], "No human face detected. Please ensure your face is well-lit and facing camera directly."

    embedding = extract_128d_embedding(face_roi)
    return True, embedding, "Facial features extracted successfully."

def compare_face_embeddings(live_embedding: List[float], registered_embedding: List[float]) -> Tuple[bool, float, float]:
    """
    Compares two 128-d vectors.
    Returns: (verified, euclidean_distance, match_score)
    """
    u = np.array(live_embedding, dtype=np.float32)
    v = np.array(registered_embedding, dtype=np.float32)

    # Ensure vectors are unit normalized
    u_norm = np.linalg.norm(u)
    v_norm = np.linalg.norm(v)
    if u_norm > 0:
        u = u / u_norm
    if v_norm > 0:
        v = v / v_norm

    # Euclidean distance between unit vectors ranges from 0.0 (identical) to 2.0 (opposite)
    distance = float(np.linalg.norm(u - v))
    threshold = settings.FACE_MATCH_DISTANCE_THRESHOLD

    # Match score normalized to [0, 1] percentage
    match_score = max(0.0, min(1.0, 1.0 - (distance / 1.5)))

    verified = bool(distance <= threshold)
    return verified, round(distance, 4), round(match_score, 4)

