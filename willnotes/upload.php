<?php
/*
* Detect any uploaded files, upload them to save folder and return the full URL to the file.
*/

$name = 'NOFILE.jpg';


foreach ($_FILES["files"]["error"] as $key => $error) {
	if ($error == UPLOAD_ERR_OK) {
		$name = $_FILES["files"]["name"][$key];
		$source = $_FILES["files"]["tmp_name"][$key];
		$destination = 'uploads/' . $_FILES['files']['name'][$key];

		//File exists? NO!
		if(file_exists($destination)) die('** File exists! Rename please... **');

		move_uploaded_file($source, $destination);
		break; //Only one file allowed now!
	}
}


if(isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') {
	$base_url = 'https://';
} else {
	$base_url = 'http://';
}
$base_url .= $_SERVER['SERVER_NAME'];
if($_SERVER['SERVER_PORT'] != '80') { //string or int? handle both?
	$base_url .= ':' . $_SERVER['SERVER_PORT'];
}
//Subdirectory?
$base_url .= str_replace('upload.php', '', $_SERVER['SCRIPT_NAME']);


echo $base_url.'uploads/'.$name;