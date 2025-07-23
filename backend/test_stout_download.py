#!/usr/bin/env python3

import os
import time
from pathlib import Path

print("=== STOUT Model Download Test ===")
print(f"Current working directory: {os.getcwd()}")
print(f"Current user: {os.getenv('USER', 'unknown')}")
print(f"Home directory: {os.path.expanduser('~')}")

# Check environment variables
hf_vars = ['HF_HOME', 'TRANSFORMERS_CACHE', 'HF_HUB_CACHE']
for var in hf_vars:
    print(f"{var}: {os.getenv(var, 'Not set')}")

print("\n=== Before STOUT import ===")
# Look for any existing STOUT cache
possible_locations = [
    os.path.expanduser("~/.data"),
    os.path.expanduser("~/.cache"),
    "/opt/model_cache",
    "/tmp"
]

for location in possible_locations:
    if os.path.exists(location):
        print(f"Found directory: {location}")
        if 'STOUT' in str(Path(location).glob('**/STOUT*')):
            print(f"  Contains STOUT files!")

print("\n=== Importing STOUT ===")
start_time = time.time()
from STOUT import translate_forward
import_time = time.time() - start_time
print(f"Import took {import_time:.2f} seconds")

print("\n=== After STOUT import ===")
for location in possible_locations:
    if os.path.exists(location):
        stout_dirs = list(Path(location).glob('**/STOUT*'))
        if stout_dirs:
            print(f"Found STOUT directories in {location}:")
            for d in stout_dirs:
                print(f"  {d}")

print("\n=== Calling translate_forward ===")
start_time = time.time()
result = translate_forward('CCO')  # Simple molecule (methanol)
call_time = time.time() - start_time
print(f"translate_forward('CCO') = '{result}'")
print(f"Call took {call_time:.2f} seconds")

print("\n=== After translate_forward call ===")
for location in possible_locations:
    if os.path.exists(location):
        stout_dirs = list(Path(location).glob('**/STOUT*'))
        if stout_dirs:
            print(f"Found STOUT directories in {location}:")
            for d in stout_dirs:
                print(f"  {d}")
                if d.is_dir():
                    # List contents
                    try:
                        files = list(d.rglob('*'))
                        print(f"    Contains {len(files)} files/dirs")
                        for f in files[:5]:  # Show first 5
                            print(f"    - {f}")
                        if len(files) > 5:
                            print(f"    ... and {len(files) - 5} more")
                    except PermissionError:
                        print(f"    Permission denied")

print("\n=== Search complete ===") 