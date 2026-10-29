# The shop as an image: Python, the packages the app runs on and the app
# itself, frozen. The base is pinned by digest: every build starts from the
# same bytes, whatever python:3.13-slim means tomorrow.
ARG PIN=sha256:2d44738ebf4ce5f63b9d9ea871e9c7cfdc0426f7b0c97cac915fd88ded1d86bb
FROM python:3.13-slim@${PIN}

ENV PIP_ROOT_USER_ACTION=ignore PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
# Dependencies first: this layer is rebuilt only when requirements.txt changes,
# not on every change to the code below.
COPY requirements.txt .
RUN pip install --no-cache-dir --progress-bar off -r requirements.txt
COPY book_shop/ book_shop/

USER nobody
EXPOSE 8080
CMD ["python", "-m", "book_shop.web"]
