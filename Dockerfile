FROM joseluisq/static-web-server:2.13

WORKDIR /

COPY dist /dist

EXPOSE 8080

CMD ["--port", "8080", "--root", "/dist", "--page-fallback", "/dist/index.html"]