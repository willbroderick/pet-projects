<?php
/**
* File to handle all login details
*/

function do_login($username, $password) {
	$login_response = false;
	if($username == 'canvas' && $password == 'testing123') {
		$expiry = time() + 24 * 60 * 60; //Log in for 24 hours
		return array( 'expiry' => $expiry, 'token' => hash('sha256', 'saltynuts'.$username.$expiry) );
	}
	return false;
}

function validate_login($username, $expiry, $token) {
	//Parse expiry and return false if expiry reached.
	$expiry_int = intval($expiry);
	if($expiry_int < time()) {
		return false;
	}

	//Return whether token matches salted hash of user and expiry
	return $token == hash('sha256', 'saltynuts'.$username.$expiry);
}


//Page post handling in case of login!
if(isset($_POST['username'])) {
	//Doing a post
	$login_response = do_login($_POST['username'], $_POST['password']);
	if($login_response) {
		echo '{ "status":"OK", "expiry": "'.$login_response['expiry'].'", "token": "'.$login_response['token'].'" }';
	} else {
		echo '{ "status":"ERROR", "message":"Username or password incorrect."}';
	}
}
