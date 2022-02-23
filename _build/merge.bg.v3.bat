@echo off
pushd "%~1"

SET background=background.js

break>%background%

for %%x in ( 
    "%~dp0..\extension\lib\kellyTools.js" 
    "%~dp0..\extension\lib\kellyDispetcher.js" 
    "%~dp0..\extension\lib\kellyDispetcherNetRequest.js" 
    ::"%~dp0..\extension\lib\profiles\joyreactor.unlock.d.js"
    "%~dp0..\extension\lib\recorder\kellyEDRecorder.js"
    "%~dp0..\extension\env\init\background.js"
) do (
    
    @echo.>> %background%
    @echo.>> %background%    
    copy %background% + "%%~x" %background%
)

  
    @echo.>> %background%
    @echo.>> %background%       
    @echo.>> %background%
    @echo.>> %background% 
    
popd
pause