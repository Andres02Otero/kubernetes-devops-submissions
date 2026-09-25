#!/usr/bin/env sh
set -e

TODO_BACKEND_URL="${TODO_BACKEND_URL:-http://todo-backend-svc:2345}"

# https://en.wikipedia.org/wiki/Special:Random responde con un redirect
# (302) a un articulo al azar. Pedimos solo los headers (-I, sin bajar el
# body) y leemos el header Location, tal como sugiere el enunciado.
LOCATION=$(curl -sI https://en.wikipedia.org/wiki/Special:Random | grep -i '^location:' | sed 's/^[Ll]ocation: *//' | tr -d '\r\n')

# Detalle importante: Wikipedia devuelve el Location protocol-relative
# (arranca con "//", sin "https:") -- si se manda tal cual, el link no
# serviria pegado en un navegador. Hay que normalizarlo primero.
case "$LOCATION" in
  //*) ARTICLE_URL="https:$LOCATION" ;;
  http*) ARTICLE_URL="$LOCATION" ;;
  *) ARTICLE_URL="https://en.wikipedia.org$LOCATION" ;;
esac

echo "Random article: $ARTICLE_URL"

# jq -Rs arma un string JSON valido y escapado a partir de texto plano,
# evita problemas si la URL trajera algun caracter especial.
CONTENT=$(printf 'Read %s' "$ARTICLE_URL" | jq -Rs .)

curl -s -X POST "$TODO_BACKEND_URL/todos" \
  -H "Content-Type: application/json" \
  -d "{\"content\": $CONTENT}"

echo ""
