#!/usr/bin/env sh

set -eu

HUGO_VERSION="${HUGO_VERSION:-0.111.3}"
BUILD_DIR="${PWD}/.bin"
HUGO_BIN="${BUILD_DIR}/hugo-${HUGO_VERSION}"

if [ ! -x "${HUGO_BIN}" ]; then
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"

  case "${OS}" in
    darwin)
      ASSET="hugo_extended_${HUGO_VERSION}_darwin-universal.tar.gz"
      ;;
    linux)
      case "${ARCH}" in
        x86_64 | amd64)
          ARCH="amd64"
          ;;
        arm64 | aarch64)
          ARCH="arm64"
          ;;
        *)
          echo "Unsupported architecture: ${ARCH}" >&2
          exit 1
          ;;
      esac
      ASSET="hugo_extended_${HUGO_VERSION}_${OS}-${ARCH}.tar.gz"
      ;;
    *)
      echo "Unsupported operating system: ${OS}" >&2
      exit 1
      ;;
  esac
  URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${ASSET}"
  TMPDIR="$(mktemp -d)"
  ARCHIVE="${TMPDIR}/${ASSET}"

  mkdir -p "${BUILD_DIR}"

  echo "Downloading Hugo ${HUGO_VERSION} from ${URL}" >&2
  curl -fsSL "${URL}" -o "${ARCHIVE}"
  tar -xzf "${ARCHIVE}" -C "${TMPDIR}" hugo
  mv "${TMPDIR}/hugo" "${HUGO_BIN}"
  chmod +x "${HUGO_BIN}"
  rm -rf "${TMPDIR}"
fi

exec "${HUGO_BIN}" --gc --minify
