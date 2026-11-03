import base64
import re
import cv2
import numpy as np
from typing import Optional, Tuple, List

# Initialize Haar cascade models from built-in OpenCV data
FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
EYE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def decode_base64_image(image_str: str) -> np.ndarray:
    """
    Decodes a base64 encoded image string (supports data URI schemes) into an OpenCV BGR numpy array.
    """
    # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    if ',' in image_str:
        image_str = image_str.split(',', 1)[1]

    # Clean whitespace/newlines
    image_str = re.sub(r'\s+', '', image_str)
    image_bytes = base64.b64decode(image_str)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image from base64 string")

    return img

def detect_face(img: np.ndarray) -> Tuple[bool, Optional[np.ndarray], Optional[Tuple[int, int, int, int]]]:
    """
    Detects the primary frontal face in an image.
    Returns: (found, cropped_face_bgr, (x, y, w, h))
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Histogram equalization for lighting invariance
    gray = cv2.equalizeHist(gray)

    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(50, 50),
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    if len(faces) == 0:
        return False, None, None

    # Pick the largest face detected
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    x, y, w, h = faces[0]

    # Add 10% padding
    pad_w = int(w * 0.1)
    pad_h = int(h * 0.1)
    h_img, w_img = img.shape[:2]

    x1 = max(0, x - pad_w)
    y1 = max(0, y - pad_h)
    x2 = min(w_img, x + w + pad_w)
    y2 = min(h_img, y + h + pad_h)

    face_crop = img[y1:y2, x1:x2]
    return True, face_crop, (x, y, w, h)

def detect_eyes_in_face(face_bgr: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detects eyes inside a cropped face region.
    """
    gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
    eyes = EYE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(15, 15)
    )
    return list(eyes)

