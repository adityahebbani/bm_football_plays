#!/usr/bin/env python
# coding: utf-8

# In[1]:


import argparse
import pandas as pd
from inference_sdk import InferenceHTTPClient


# In[2]:


def get_class_counts_and_positions(json_data):
    class_counts = {}
    positions = []

    for item in json_data:
        predictions = item.get("predictions", {}).get("predictions", [])
        for pred in predictions:
            class_name = pred["class"]
            x, y = pred["x"], pred["y"]

            class_counts[class_name] = class_counts.get(class_name, 0) + 1
            positions.append({"class": class_name, "x": x, "y": y})

    return class_counts, positions


# In[3]:


def main(image_path):
    client = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key="hB8S8n5OlohSOI3c51ic"
    )

    result = client.run_workflow(
        workspace_name="boilermake-2025",
        workflow_id="custom-workflow-3",
        images={"image": image_path},
        use_cache=True  # Cache workflow definition for 15 minutes
    )

    class_counts, positions = get_class_counts_and_positions(result)
    df = pd.DataFrame(positions)

    # print("Class Counts:", class_counts)
    return df


# In[ ]:


# Change this line below as this is a hardcoded test image - this needs to be dynamic path


# In[4]:


df = main(r"C:\Users\davep\personalWebsite\personal\purdue\train\images\57506_000803_Sideline_frame1054_jpg.rf.8badf33635e4f479aabb0bb1f9c296fe.jpg")


# In[5]:


df


# In[6]:


positions = ["running_back", "wide_receiver", "tight_end", "qb"]


# In[7]:


counts = df['class'].value_counts()


# In[8]:


position_counts = {pos: counts.get(pos, 0) for pos in positions}


# In[9]:


position_counts #dict to represent counts of each position 


# In[10]:


position_df = pd.DataFrame([position_counts])


# In[11]:


position_df


# In[25]:


def classify_formation(num_qbs, num_rbs, num_tes, num_wrs):
    if num_qbs == 0:
        return "WILDCAT"
    elif num_rbs == 0:
        return "EMPTY"
    elif num_qbs == 1 and num_rbs == 1 and num_tes >= 2 and num_wrs <= 2:
        return "JUMBO"
    elif num_qbs == 1 and num_rbs == 2:
        return "I_FORM"
    elif num_qbs == 1 and num_rbs == 1:
        return "PISTOL" if num_tes >= 1 and num_wrs >= 2 else "SINGLEBACK"
    elif num_qbs == 1 and num_rbs >= 1:
        return "SHOTGUN"
    return "UNKNOWN"  


# In[26]:


num_qbs = position_df.loc[0, "qb"]
num_rbs = position_df.loc[0, "running_back"]
num_tes = position_df.loc[0, "tight_end"]
num_wrs = position_df.loc[0, "wide_receiver"]


# In[27]:


num_qbs


# In[28]:


formation = classify_formation(num_qbs, num_rbs, num_tes, num_wrs)


# In[29]:


formation


# In[ ]:


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run inference on an image and display results.")
    parser.add_argument("image", help="Path to the input image.")
    args = parser.parse_args()

    main(args.image)


# In[ ]:




