@echo off
pushd "%~1"
SET frontend=jhelper.user.js
SET background=background/bg.js
echo.>%frontend%
:: for /r 
for %%x in ("kellyFavItemsHelper.js" "kellyImageView.js" "kellyThreadWork.js" "kellyGrabber.js" "init.js" ) do (
    
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo //%%~x>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    
    copy %frontend% + "%%~x" %frontend%
)

echo.>%background%
for %%x in ("kellyGrabber.js" "KellyDispetcher.js" "init_bg.js" ) do (
    
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo //%%~x>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    @echo.>> %frontend%
    
    copy %frontend% + "%%~x" %frontend%
)

:: copy tmp.js + "%%~x" tmp.js > NUL
popd