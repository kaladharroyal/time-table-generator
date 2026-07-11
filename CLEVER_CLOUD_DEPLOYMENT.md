# Deploying to Clever Cloud Platform

This guide explains how to deploy the **Time Table Generator** application to Clever Cloud with a MySQL database.

---

## 🏗️ Deployment Overview

Clever Cloud is a Platform as a Service (PaaS). To run this application, you will create:
1. A **Python Application** (which will host the Flask backend and static files).
2. A **MySQL Add-on** (which will host the timetable database).

The database credentials will be automatically shared with the Python application through Clever Cloud's environment variables. We have configured the application code to read these variables automatically.

---

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Prepare Your Code
We have already modified the codebase for Clever Cloud deployment:
- Added `gunicorn` to [requirements.txt](file:///D:/kaladharroyal/time-table-generator-main/requirements.txt) (production WSGI server).
- Configured [app.py](file:///D:/kaladharroyal/time-table-generator-main/app.py) and [setup_db.py](file:///D:/kaladharroyal/time-table-generator-main/setup_db.py) to read database configuration from Clever Cloud's environment variables (`MYSQL_ADDON_...`).
- Created a proper [.gitignore](file:///D:/kaladharroyal/time-table-generator-main/.gitignore) file to avoid committing local environment configurations.

### Step 2: Create a MySQL Add-on on Clever Cloud
1. Log in to the **Clever Cloud Console**.
2. Click **Create...** > **an add-on** > select **MySQL**.
3. Choose the plan (the free **Dev** plan is sufficient for testing).
4. Click **Next** and link it later or name it `timetable-db`.

### Step 3: Create a Python Application
1. Click **Create...** > **an application**.
2. Select **Python** as the runtime platform.
3. Select whether you want to deploy via **Git** (recommended) or **GitHub**.
4. Choose the size of the instance (the **XS** or **S** instance is perfect for this app).
5. Click **Next**.

### Step 4: Link the MySQL Add-on to your Application
1. Go to your Python Application dashboard in Clever Cloud.
2. Select **Service Dependencies** from the left menu.
3. Link your newly created **MySQL** add-on to the application.
   *(This automatically injects the `MYSQL_ADDON_...` environment variables into your application).*

### Step 5: Configure Clever Cloud Environment Variables
Go to the **Environment Variables** section in your Clever Cloud console for the Python application and add the following:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `CC_PYTHON_BACKEND` | `gunicorn` | Tells Clever Cloud to use Gunicorn as the WSGI server |
| `CC_PYTHON_MODULE` | `app:app` | Tells Gunicorn to look for the `app` instance inside `app.py` |

---

## 🗄️ Database Initialization

> [!WARNING]
> [schema.sql](file:///D:/kaladharroyal/time-table-generator-main/schema.sql) contains `TRUNCATE TABLE` commands.
> Running `python setup_db.py` will wipe out and re-initialize all data.
> **Do not run this script on every deployment.**

To initialize the database for the first time, you have two options:

### Option A: Run via Clever Cloud CLI (Recommended)
If you have the `clever-tools` CLI installed locally:
1. Run `clever ssh` to connect to your running application VM.
2. Run the database setup script manually:
   ```bash
   python setup_db.py
   ```

### Option B: Use a Temporary Hook
1. Add an environment variable in the Clever Cloud Console:
   - **Key**: `CC_RUN_SUCCEEDED_HOOK`
   - **Value**: `python setup_db.py`
2. Trigger a redeployment. The setup script will run and seed the database.
3. **Important**: Once the deployment succeeds and database is created, **delete the `CC_RUN_SUCCEEDED_HOOK` environment variable** so that future deployments do not wipe out your saved timetables!
