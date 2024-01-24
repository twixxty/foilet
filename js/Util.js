var CookieUtil = {};

CookieUtil.setCookie = function(name, value, expiration) 
{
	//expiration in days. 
	//Use 0 or leave empty for session cookie
	//Use negative value to delete cookie
	var expString = "";
	if (expiration>0)
	{
		var expDate = new Date(Date.now() + expiration*24*60*60*1000);
		expString = "; expires="+expDate.toGMTString();
	}
	document.cookie = name + "=" + value + expString;
};

CookieUtil.getCookie = function(name) 
{
	name = name + "=";
	var all = document.cookie.split(';');	
	for(var i = 0; i < all.length; i++)
	{
		var cookie = all[i].trim();
		if(cookie.indexOf(name) === 0)
		return cookie.substring(name.length, cookie.length);
	}	
	return null;
};

CookieUtil.deleteCookie = function(name) 
{
	CookieUtil.setCookie(name,"",-1);
}