FROM continuumio/miniconda3:latest

# Copy environment.yml
COPY environment.yml /tmp/environment.yml

# Create the conda environment (now includes openjdk)
RUN conda env create -f /tmp/environment.yml

# Make RUN commands use the new environment:
SHELL ["/bin/bash", "-c"]

# Activate the environment and ensure conda is initialized
ENV PATH=/opt/conda/envs/stout-backend/bin:$PATH
ENV JAVA_HOME=/opt/conda/envs/stout-backend

# Set the working directory
WORKDIR /app

# Copy backend code
COPY . /app

# Expose port
EXPOSE 8000

# Run the FastAPI app
CMD ["/opt/conda/envs/stout-backend/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 