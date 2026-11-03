import cv2
import numpy as np
from typing import List, Tuple
from app.utils.image_processing import decode_base64_image, detect_face, detect_eyes_in_face
from app.core.config import settings

def compute_eye_aspect_ratio_approx(eye_roi: np.ndarray) -> float:
    """
    Approximates Eye Aspect Ratio (EAR) using vertical-to-horizontal intensity gradient ratio
    in the detected eye region.
    """
    if eye_roi is None or eye_roi.size == 0:
        return 0.20
    gray = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY) if len(eye_roi.shape) == 3 else eye_roi
    h, w = gray.shape

    # Vertical gradient (eyelid boundaries) vs horizontal gradient
    sobel_v = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    sobel_h = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)

    mean_v = np.mean(np.abs(sobel_v))
    mean_h = np.mean(np.abs(sobel_h)) + 1e-5

    ratio = float(mean_v / mean_h)
    # Normalized approx EAR score
    return max(0.1, min(0.45, ratio * 0.25))

def evaluate_liveness_frames(frames_base64: List[str]) -> Tuple[bool, int, List[float], float, str]:
    """
    Analyzes a sequence of frames for anti-spoofing and blink/motion detection.
    Supports voters wearing eyeglasses by inspecting anatomical upper-face eye bands
    alongside cascade detectors and temporal micro-motion analysis.
    Returns: (liveness_passed, blinks_detected, ear_scores, variance, message)
    """
    if len(frames_base64) < 2:
        return False, 0, [], 0.0, "At least 2 consecutive frames required for liveness evaluation"

    ear_scores = []
    face_crops = []

    for idx, b64 in enumerate(frames_base64):
        try:
            img = decode_base64_image(b64)
            found, face_roi, bbox = detect_face(img)
            if not found or face_roi is None:
                continue

            face_crops.append(face_roi)
            h_f, w_f = face_roi.shape[:2]

            # Anatomical upper-face eye region (20% to 52% of face height)
            # Robust for users wearing glasses/spectacles where Haar cascades struggle
            y_start, y_end = int(h_f * 0.20), int(h_f * 0.52)
            x_start, x_end = int(w_f * 0.15), int(w_f * 0.85)
            eye_band = face_roi[y_start:y_end, x_start:x_end]

            eyes = detect_eyes_in_face(face_roi)

            if len(eyes) > 0:
                frame_ears = []
                for (ex, ey, ew, eh) in eyes[:2]:
                    eye_crop = face_roi[ey:ey+eh, ex:ex+ew]
                    frame_ears.append(compute_eye_aspect_ratio_approx(eye_crop))
                ear_scores.append(float(np.mean(frame_ears)))
            elif eye_band.size > 0:
                # Approximate EAR from vertical eyelid Sobel gradients in eye band
                ear_scores.append(compute_eye_aspect_ratio_approx(eye_band))
            else:
                ear_scores.append(0.20)
        except Exception:
            continue

    if len(face_crops) < 2:
        return False, 0, ear_scores, 0.0, "Face could not be consistently tracked across frame sequence"

    # 1. Temporal optical variation between first and last normalized face crops
    crop0 = cv2.resize(face_crops[0], (100, 100))
    crop1 = cv2.resize(face_crops[-1], (100, 100))
    diff = float(np.mean(cv2.absdiff(crop0, crop1)))

    # 2. Eye-band specific temporal variance (detects blinking/eyelid movements even with glasses)
    h0, w0 = face_crops[0].shape[:2]
    h1, w1 = face_crops[-1].shape[:2]
    band0 = cv2.resize(face_crops[0][int(h0*0.2):int(h0*0.52), int(w0*0.15):int(w0*0.85)], (60, 30))
    band1 = cv2.resize(face_crops[-1][int(h1*0.2):int(h1*0.52), int(w1*0.15):int(w1*0.85)], (60, 30))
    band_diff = float(np.mean(cv2.absdiff(band0, band1)))

    # 3. Count blink events (EAR dipping below threshold and rebounding)
    blink_count = 0
    blink_threshold = settings.EAR_BLINK_THRESHOLD
    for i in range(1, len(ear_scores) - 1):
        if ear_scores[i] < blink_threshold and ear_scores[i-1] >= blink_threshold:
            blink_count += 1

    ear_variance = float(np.var(ear_scores)) if len(ear_scores) > 1 else 0.0

    # Anti-spoofing verification:
    # A flat static photo/paper held to the camera yields diff < 0.40 and band_diff < 0.40.
    # A real human in front of a live webcam naturally has sensor noise, breathing micro-motion,
    # eye movements, or blinks (diff >= 0.60 or band_diff >= 0.55 or blink_count > 0).
    is_live = bool(
        (blink_count > 0) or
        (band_diff >= 0.55) or
        (diff >= 0.60) or
        (ear_variance >= 0.00003)
    )

    msg = "Liveness verified. Natural human biometric micro-movements detected." if is_live else "Anti-spoofing alert: Static image or synthetic replay detected."

    return is_live, blink_count, [round(x, 4) for x in ear_scores], round(float(diff), 4), msg
