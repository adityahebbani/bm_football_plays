import cv2
import sys
import os
import tempfile
from inference_sdk import InferenceHTTPClient

# Replace with your actual API key
API_KEY = "hB8S8n5OlohSOI3c51ic"
MODEL_ID = "football-presnap-tracker/6"

CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=API_KEY
)

def process_frame(frame):
    """
    Save the frame temporarily, run inference on it,
    draw bounding boxes from the inference results, and return the frame.
    """
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
        return frame

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
            cv2.rectangle(frame, (top_left_x, top_left_y), (top_left_x + w, top_left_y + h), (0, 255, 0), 2)
            cv2.putText(frame, pred.get("class", "object"), (top_left_x, top_left_y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            print(f"Drawn box for {pred.get('class', 'object')} at ({top_left_x}, {top_left_y}), w: {w}, h: {h}")
    return frame

def process_video(input_path, output_path):
    print("Opening video:", input_path)
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error: Could not open input video.")
        sys.exit(1)

    # Get video FPS as float.
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps < 1:
        print("Warning: FPS not found, defaulting to 25")
        fps = 25.0
    print("Frames per second (FPS):", fps)

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print("Frame dimensions: {}x{}".format(width, height))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    if not out.isOpened():
        print("Error: VideoWriter failed to open.")
        sys.exit(1)
    print("VideoWriter opened for output:", output_path)

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            print("No more frames to read. Total frames processed:", frame_count)
            break

        frame_count += 1
        # Process one frame every second:
        # Using the float value of fps, we round the frame number to determine a one-per-second frame.
        if frame_count % int(round(fps)) == 0:
            print(f"Processing inference on frame {frame_count}")
            processed_frame = process_frame(frame)
        else:
            processed_frame = frame
            if frame_count % int(round(fps)) == 1:
                print(f"Skipping inference on frame {frame_count}")

        out.write(processed_frame)
        if frame_count % 50 == 0:
            print(f"Written {frame_count} frames so far.")

    cap.release()
    out.release()
    print("Video processing complete. Processed video saved at:", output_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_video.py <input_video_path> <output_video_path>")
        sys.exit(1)
    input_video = sys.argv[1]
    output_video = sys.argv[2]
    process_video(input_video, output_video)