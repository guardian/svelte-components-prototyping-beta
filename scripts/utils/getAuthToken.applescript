use AppleScript version "2.4" -- Yosemite (10.10) or later
use framework "Foundation"
use scripting additions

use da : script "gnmDesktopAuthAdditions"

set didAuth to da's waitForAuthenticationGivingUpAfter:0
if didAuth is false then
	return ""
end if
set authToken to da's readToken() as text
return authToken