#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import f1_score
from sklearn.metrics import precision_score, recall_score
from sklearn.model_selection import RandomizedSearchCV
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder


# In[2]:


pd.set_option('display.max_columns', None)


# In[3]:


df_big_data_bowl = pd.read_csv(r"C:\Users\davep\Downloads\plays.csv")
df_nfl_verse = pd.read_csv(r"C:\Users\davep\Downloads\play_by_play_2022.csv")


# In[4]:


df_nfl_verse


# In[5]:


df_big_data_bowl


# In[6]:


df_big_data_bowl[(df_big_data_bowl["gameId"] == 2022102302) & (df_big_data_bowl["gameClock"] == "01:54")]


# In[7]:


pd.set_option('display.max_columns', None)
#pd.set_option('display.max_rows', None)


# In[8]:


df_big_data_bowl = df_big_data_bowl[[
    "quarter", "down", "yardsToGo", "possessionTeam",
    "defensiveTeam", "yardlineNumber",
    "preSnapHomeScore", "preSnapVisitorScore", 
    "offenseFormation", "playClockAtSnap", "rushLocationType", "gameId", "playId"
]]


# In[9]:


df_nfl_verse = df_nfl_verse[["home_team", "away_team", "quarter_seconds_remaining", 
                            "down", "goal_to_go", "ydstogo", "play_type", "pass_length", "pass_location",
                            "shotgun", "qb_dropback", "qb_kneel", "qb_spike", "qb_scramble", "run_location",
                            "run_gap", "old_game_id", "play_id", "qtr", "posteam"]]


# In[10]:


merge_columns_big_data_bowl = ["gameId", "playId", "quarter", "down", "yardsToGo", "possessionTeam"]


# In[11]:


merge_columns_nfl_verse = ["old_game_id", "play_id", "qtr", "down", "ydstogo", "posteam"]


# In[12]:


merged = df_nfl_verse.merge(
    df_big_data_bowl, 
    left_on=merge_columns_nfl_verse, 
    right_on=merge_columns_big_data_bowl, 
    how="inner"
)


# In[13]:


merged


# In[14]:


merged = merged[["down", "ydstogo", "play_type", "qtr", "yardlineNumber", "quarter_seconds_remaining", "offenseFormation", 
                "playClockAtSnap"]]


# In[15]:


merged


# In[16]:


for col in merged.columns:
    print(merged[col].isna().sum())


# In[17]:


merged['offenseFormation'].value_counts()


# In[18]:


merged = merged.dropna(subset=["offenseFormation"])


# In[19]:


merged["playClockAtSnap"].fillna(merged["playClockAtSnap"].mean(), inplace=True)


# In[20]:


merged


# In[21]:


merged["qtr"].value_counts()


# In[22]:


y = merged["play_type"]
X = merged.drop(columns=["play_type"])


# In[23]:


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


# In[24]:


X_train


# In[25]:


y_train.value_counts()


# In[26]:


X_train["total_seconds_remaining"] = (4 - X_train["qtr"]) * 900 + X_train["quarter_seconds_remaining"]


# In[27]:


X_train


# In[28]:


X_train["offenseFormation"].value_counts()


# In[29]:


numerical_features = ["down", "ydstogo", "qtr", "yardlineNumber", "quarter_seconds_remaining", "playClockAtSnap", "total_seconds_remaining"]
categorical_features = ["offenseFormation"]


# In[30]:


preprocessor = ColumnTransformer(
    transformers=[
        ("num", MinMaxScaler(), numerical_features),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=True), categorical_features)
    ]
)


# In[31]:


X_train = preprocessor.fit_transform(X_train)


# In[32]:


X_train


# # MODELING SH*T HERE FOR TRAIN

# In[33]:


y_train.value_counts()


# In[34]:


# param_grid = {
#     'n_estimators': [100, 200, 300, 400],
#     'max_depth': [None, 10, 20, 30, 40],
#     'min_samples_split': [2, 5, 10],
#     'min_samples_leaf': [1, 2, 4],
#     'max_features': ['sqrt', 'log2', None],  # Valid options for max_features
#     'bootstrap': [True, False]
# }

param_grid = {
    'n_estimators': np.arange(100, 500, 50),
    'max_depth': np.arange(3, 10, 1),
    'learning_rate': np.linspace(0.01, 0.3, 10),
    'subsample': np.linspace(0.5, 1.0, 5),
    'colsample_bytree': np.linspace(0.5, 1.0, 5),
    'gamma': np.linspace(0, 5, 5),
    'reg_alpha': np.logspace(-3, 1, 5),
    'reg_lambda': np.logspace(-3, 1, 5)
}


# In[35]:


xgb = XGBClassifier(objective='binary:logistic', random_state=42)


# In[36]:


rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
# rf_model.fit(X_train, y_train)


# In[37]:


# random_search = RandomizedSearchCV(
#     estimator=rf_model,
#     param_distributions=param_grid,
#     n_iter=10,  
#     cv=5,  
#     verbose=2,  
#     random_state=42,  
#     n_jobs=-1  
# )

random_search = RandomizedSearchCV(
    estimator=xgb,
    param_distributions=param_grid,
    n_iter=30,  # Number of random samples
    scoring='f1',  # Use F1 score for evaluation
    cv=5,
    verbose=2,
    n_jobs=-1
)


# In[38]:


label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)


# In[39]:


random_search.fit(X_train, y_train_encoded)
#best_rf_model = random_search.best_estimator_


# # TEST STUFF

# In[40]:


X_test["total_seconds_remaining"] = (4 - X_test["qtr"]) * 900 + X_test["quarter_seconds_remaining"]


# In[41]:


X_test = preprocessor.transform(X_test)


# In[42]:


X_test


# In[43]:


y_pred_encoded = random_search.best_estimator_.predict(X_test)
y_pred = label_encoder.inverse_transform(y_pred_encoded)


# In[44]:


#y_pred = best_rf_model.predict(X_test)
# y_pred = rf_model.predict(X_test)


# In[45]:


y_pred


# In[46]:


accuracy = accuracy_score(y_test, y_pred)


# In[47]:


precision = precision_score(y_test, y_pred, pos_label='pass')  # Use 'pass' as the positive class
recall = recall_score(y_test, y_pred, pos_label='pass')


# In[48]:


accuracy


# In[49]:


precision


# In[50]:


recall


# In[51]:


y_test.value_counts()


# # Formation Terminology

# Worst case option: From nflverse, use qb_dropback booelan feature as a heuristic for yards between o line and qb. 

# SHOTGUN: QB 5-7 yds behind o-line        
# SINGLEBACK    
# EMPTY         
# I_FORM         
# PISTOL         
# JUMBO           
# WILDCAT         
