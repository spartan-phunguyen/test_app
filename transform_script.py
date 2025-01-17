import sys
import json
import cv2
import numpy as np

# Đọc tham số từ command line
image_path = sys.argv[1]
params = json.loads(sys.argv[2])

# Đọc ảnh
image = cv2.imread(image_path)

def compute_birdseye_homography(camera_height, tilt_angle, focal_length, principal_point):
    """
    Compute the homography matrix for bird's-eye view using camera parameters.
    """
    theta = np.radians(tilt_angle)
    fx = fy = focal_length
    cx, cy = principal_point
    K = np.array([
        [fx, 0, cx],
        [0, fy, cy],
        [0,  0,  1]
    ])
    R = np.array([
        [1, 0, 0],
        [0, np.cos(theta), -np.sin(theta)],
        [0, np.sin(theta),  np.cos(theta)]
    ])
    H = K @ R @ np.linalg.inv(K)
    return H

def get_transformed_bounds(image, H):
    """
    Calculate the bounds of the transformed image.
    """
    h, w = image.shape[:2]
    corners = np.array([
        [0, 0, 1],
        [w, 0, 1],
        [0, h, 1],
        [w, h, 1]
    ]).T
    transformed_corners = H @ corners
    transformed_corners /= transformed_corners[2]
    x_coords = transformed_corners[0]
    y_coords = transformed_corners[1]
    x_min, x_max = np.min(x_coords), np.max(x_coords)
    y_min, y_max = np.min(y_coords), np.max(y_coords)
    new_width = int(np.ceil(x_max - x_min))
    new_height = int(np.ceil(y_max - y_min))
    translation_matrix = np.array([
        [1, 0, -x_min],
        [0, 1, -y_min],
        [0, 0, 1]
    ])
    adjusted_H = translation_matrix @ H
    return new_width, new_height, adjusted_H

def crop_or_resize(image, max_width, max_height):
    """
    Crop or resize an image to fit within a specified window size.
    """
    h, w = image.shape[:2]
    scale = min(max_width / w, max_height / h)
    if scale < 1:
        # Resize image if larger than allowed window
        new_w = int(w * scale)
        new_h = int(h * scale)
        resized_image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return resized_image
    else:
        # No resizing needed
        return image

# Lấy tham số
camera_height = params['camera_height']
tilt_angle = params['tilt_angle']
focal_length = params['focal_length']
principal_point = tuple(params['principal_point'])

# Thực hiện transform
H = compute_birdseye_homography(camera_height, tilt_angle, focal_length, principal_point)
new_width, new_height, adjusted_H = get_transformed_bounds(image, H)
birdseye_image = cv2.warpPerspective(image, adjusted_H, (new_width, new_height))
birdseye_image_fitted = crop_or_resize(birdseye_image, 1080, 720)

# Lưu kết quả
cv2.imwrite('temp/output.png', birdseye_image_fitted) 