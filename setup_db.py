import pymysql
import os
import re
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

host = os.getenv('MYSQL_ADDON_HOST', os.getenv('MYSQL_HOST', 'localhost'))
user = os.getenv('MYSQL_ADDON_USER', os.getenv('MYSQL_USER', 'root'))
password = os.getenv('MYSQL_ADDON_PASSWORD', os.getenv('MYSQL_PASSWORD', 'Kaladhar*011'))
database = os.getenv('MYSQL_ADDON_DB', os.getenv('MYSQL_DB', 'time_table'))
port = int(os.getenv('MYSQL_ADDON_PORT', 3306))

print(f"Connecting to MySQL at {host}:{port} as {user}...")

try:
    # First, connect without a database to create it
    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        port=port,
        autocommit=True
    )
    
    with conn.cursor() as cursor:
        print(f"Creating database {database} if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
        cursor.execute(f"USE {database}")
        
        print("Reading schema.sql...")
        with open('schema.sql', 'r') as f:
            sql_script = f.read()
            
        # Remove SQL comments (line comments starting with --)
        sql_script = re.sub(r'--.*', '', sql_script)
        
        # Split by semicolon
        # Note: This is still simple but should work for this schema.sql
        sql_commands = sql_script.split(';')
        
        print(f"Executing commands...")
        executed_count = 0
        for cmd in sql_commands:
            cleaned_cmd = cmd.strip()
            if cleaned_cmd:
                try:
                    cursor.execute(cleaned_cmd)
                    executed_count += 1
                except Exception as e:
                    # Log error and continue
                    print(f"Warning: Command failed: {cleaned_cmd[:50]}... Error: {e}")
        
        print(f"Executed {executed_count} SQL commands.")
    
    conn.close()
    print("Database setup successfully completed!")

except Exception as e:
    print(f"Failed to setup database: {e}")
    if "conn" in locals():
        conn.close()
    exit(1)
