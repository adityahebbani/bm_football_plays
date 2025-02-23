import cv2
import sys
import os
import tempfile
from inference_sdk import InferenceHTTPClient

# Replace with your actual API key
API_KEY = "hB8S8n5OlohSOI3c51ic"
MODEL_ID = "presnaps-large-model/1"

CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=API_KEY
)

def get_boxes(frame):
    """
    Run inference on the provided frame and return a list of bounding boxes.
    Each bbox is a dict with keys: 'top_left_x', 'top_left_y', 'w', 'h', and 'label'.
    """
    boxes = []
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_filename = tmp.name
        cv2.imwrite(tmp_filename, frame)
    print("Saved temporary frame for inference:", tmp_filename)
    
    try:
        result = CLIENT.infer(tmp_filename, model_id=MODEL_ID)
        print("Inference result:", result)
    except Exception as e:
        print("Inference error:", e)
        os.remove(tmp_filename)
        return boxes

    os.remove(tmp_filename)
    print("Temporary file removed:", tmp_filename)

    if "predictions" in result:
        for pred in result["predictions"]:
            x = int(pred["x"])
            y = int(pred["y"])
            w = int(pred["width"])
            h = int(pred["height"])
            top_left_x = int(x - w / 2)
            top_left_y = int(y - h / 2)
            box = {
                "top_left_x": top_left_x,
                "top_left_y": top_left_y,
                "w": w,
                "h": h,
                "label": pred.get("class", "object")
            }
            boxes.append(box)
            print(f"Inferred box for {box['label']} at ({top_left_x}, {top_left_y}), w: {w}, h: {h}")
    return boxes

def draw_boxes(frame, boxes):
    """
    Draw the given bounding boxes on the frame.
    """
    for box in boxes:
        tl_x = box["top_left_x"]
        tl_y = box["top_left_y"]
        w = box["w"]
        h = box["h"]
        cv2.rectangle(frame, (tl_x, tl_y), (tl_x + w, tl_y + h), (0, 255, 0), 2)
        cv2.putText(frame, box["label"], (tl_x, tl_y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        print(f"Drawn persistent box for {box['label']} at ({tl_x}, {tl_y}), w: {w}, h: {h}")
    return frame

def process_video(input_path, output_path):
    print("Opening input video:", input_path)
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error: Could not open input video.")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps < 1:
        print("Warning: FPS not found. Defaulting to 25.")
        fps = 25.0
    print("Detected Frames Per Second (FPS):", fps)
    
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print("Frame dimensions (width x height): {} x {}".format(width, height))
    
    # Use 'avc1' codec for H.264 encoding.
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    if not out.isOpened():
        print("Error: Could not open output video for writing.")
        sys.exit(1)
    print("Writing output to:", output_path)
    
    frame_count = 0
    round_fps = int(round(fps))
    cached_boxes = []  # holds the bounding boxes for the current second
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("End of input video reached. Total frames processed:", frame_count)
            break
    
        frame_count += 1

        # Determine the "second" for the current frame
        current_sec = frame_count // round_fps

        # If this frame is the first of a new second, run inference and cache bbox data.
        if frame_count % round_fps == 0:
            print(f"Running inference on frame {frame_count} (second {current_sec})")
            cached_boxes = get_boxes(frame)
        else:
            if frame_count % round_fps == 1:
                print(f"Using cached boxes for second {current_sec}")
    
        # Draw the cached bounding boxes on the current frame.
        output_frame = draw_boxes(frame.copy(), cached_boxes)
        
        out.write(output_frame)
    
        if frame_count % 50 == 0:
            print(f"Wrote {frame_count} frames so far...")
    
    cap.release()
    out.release()
    print(f"Processing complete. Output saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_video.py <input_video> <output_video>")
        sys.exit(1)
    
    input_video_path = sys.argv[1]
    output_video_path = sys.argv[2]
    process_video(input_video_path, output_video_path)