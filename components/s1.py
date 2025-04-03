import cv2
import numpy as np

class BirdsEyeTransformer:
    def __init__(self, camera_height=15.5, pitch=30, yaw=10, roll=10, focal_length=400):
        """
        Initialize transformer with camera parameters.
        """
        self.camera_height = camera_height
        self.pitch = pitch
        self.yaw = yaw 
        self.roll = roll
        self.focal_length = focal_length
        
    def compute_birdseye_homography(self, principal_point):
        """
        Compute homography matrix for bird's-eye view based on camera parameters.
        """
        # Convert degrees to radians
        pitch_rad = np.radians(self.pitch)
        yaw_rad = np.radians(self.yaw)
        roll_rad = np.radians(self.roll)
        cx, cy = principal_point
        
        # Intrinsic matrix K
        K = np.array([
            [self.focal_length, 0, cx],
            [0, self.focal_length, cy],
            [0, 0, 1]
        ])
        
        # Rotation matrices
        Rx = np.array([
            [1, 0, 0],
            [0, np.cos(pitch_rad), -np.sin(pitch_rad)],
            [0, np.sin(pitch_rad), np.cos(pitch_rad)]
        ])
        
        Ry = np.array([
            [np.cos(yaw_rad), 0, np.sin(yaw_rad)],
            [0, 1, 0],
            [-np.sin(yaw_rad), 0, np.cos(yaw_rad)]
        ])
        
        Rz = np.array([
            [np.cos(roll_rad), -np.sin(roll_rad), 0],
            [np.sin(roll_rad), np.cos(roll_rad), 0],
            [0, 0, 1]
        ])
        
        # Calculate R = Rz * Ry * Rx
        R = Rz @ Ry @ Rx
        
        # Calculate H = K * R * K^-1
        H = K @ R @ np.linalg.inv(K)
        return H

    @staticmethod
    def get_transformed_bounds(image, H):
        """
        Calculate dimensions of the transformed image.
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

    @staticmethod
    def crop_or_resize(image, max_width, max_height):
        """
        Crop or resize image to fit window dimensions while maintaining aspect ratio.
        """
        h, w = image.shape[:2]
        scale = min(max_width / w, max_height / h)
        if scale < 1:
            new_w = int(w * scale)
            new_h = int(h * scale)
            resized_image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
            return resized_image
        return image

    def transform_image(self, image, max_width=1080, max_height=720):
        """
        Transform image to bird's-eye view perspective.
        """
        principal_point = (image.shape[1] // 2, image.shape[0] // 2)
        H = self.compute_birdseye_homography(principal_point)
        new_width, new_height, adjusted_H = self.get_transformed_bounds(image, H)
        birdseye_image = cv2.warpPerspective(image, adjusted_H, (new_width, new_height))
        return self.crop_or_resize(birdseye_image, max_width, max_height)

if __name__ == "__main__":
    # Initialize transformer
    transformer = BirdsEyeTransformer(
        camera_height=15.5,
        pitch=30,
        yaw=10,
        roll=10,
        focal_length=400
    )
    
    # Load image
    image_path = "Untitled.png"
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at path: {image_path}")
    
    print(image.shape[0], image.shape[1])
    image = image[-450:, :, :]  # Crop the bottom 450 pixels of the image
    
    # Transform image
    birdseye_image_fitted = transformer.transform_image(image)
    
    # Display results
    cv2.imshow("Original Image", image)
    cv2.imshow("Bird's-Eye View (Fitted)", birdseye_image_fitted)
    cv2.waitKey(0)
    cv2.destroyAllWindows()