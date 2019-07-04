<?php

if (isset($_POST["first-name"]) && ($_POST["first-name"] != "") && isset($_POST["surname"]) && ($_POST["surname"] != "") && isset($_POST["email"]) && ($_POST["email"] != "")) {
    
    $firstName = urldecode($_POST["first-name"]);
    $surname = urldecode($_POST["surname"]);
    $email = urldecode($_POST["email"]);
    $phone = (isset($_POST["phone"]) && $_POST["phone"] != "") ? urldecode($_POST["phone"]) : "-";
    $company = (isset($_POST["company"]) && $_POST["company"] != "") ? urldecode($_POST["company"]) : "-";
    $website = (isset($_POST["website"]) && $_POST["website"] != "") ? urldecode($_POST["website"]) : "-";
    $message = (isset($_POST["message"]) && $_POST["message"] != "") ? urldecode($_POST["message"]) : "-";
    $consent = (isset($_POST["comm-consent"]) && $_POST["comm-consent"] != "") ? urldecode($_POST["comm-consent"]) : "No";
    if ($consent !== "No") {
        $consent = ($consent == "false") ? "No" : "Yes";
    }
    
    $recipient = "info@levitatedigital.co.uk";
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=utf8" . "\r\n";
    $headers .= "From: info@levitatedigital.co.uk" . "\r\n";

    $body = "<html><body><table style='font-family: Arial, sans-serif;'><tbody>";
    $body .= "<tr><td style='padding: 8px;'>First Name: </td><td>$firstName</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Surname: </td><td>$surname</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Email Address: </td><td>$email</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Phone Number: </td><td>$phone</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Company Name: </td><td>$company</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Website URL: </td><td>$website</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Message: </td><td>$message</td></tr>";
    $body .= "<tr><td style='padding: 8px;'>Subscribed to Emails: </td><td>$consent</td></tr>";
    $body .= "</tbody></table></body></html>";

    if(mail($recipient, "Website Contact Form Submission", $body, $headers)) {
        echo json_encode(array("redirectUrl" => "contact-thank-you/"));
    } else {
        echo json_encode(array("message" => "The enquiry has not been submitted, please try again. If this problem persists, let us know. (info@levitatedigital.co.uk)"));
    }

} else {
    echo json_encode(array("message" => "Invalid parameters supplied."));
}

?>