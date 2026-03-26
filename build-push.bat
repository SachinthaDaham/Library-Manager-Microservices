@echo off
set "services=api-gateway auth-service book-service borrow-service fine-service notification-service reservation-service frontend"
for %%s in (%services%) do (
    echo Building %%s
    docker build -t dahamsachintha1/%%s:latest ./%%s || exit /b 1
    echo Pushing %%s
    docker push dahamsachintha1/%%s:latest || exit /b 1
)
echo All pushed!
