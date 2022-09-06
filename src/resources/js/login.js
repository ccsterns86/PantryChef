function openSignUpModal() {
  var myInput = document.getElementById("psw");
  var confirmMyInput = document.getElementById("cpsw");
  var letter = document.getElementById("letter");
  var capital = document.getElementById("capital");
  var number = document.getElementById("number");
  var length = document.getElementById("length");
  var match = document.getElementById("match");

  var lowerCaseLetters = /[a-z]/g; 
  var upperCaseLetters = /[A-Z]/g;
  var numbers = /[0-9]/g; 
  var minLength = 8; 

  console.log(letter.classList)

  confirmMyInput.onkeyup = function () {
  // Validate lowercase letters
  if (myInput.value.match(lowerCaseLetters)) {
    letter.classList.remove("invalid");
    letter.classList.add("valid");
  } else {
    letter.classList.remove("valid");
    letter.classList.add("invalid");
  }

  // Validate capital letters
  if (myInput.value.match(upperCaseLetters)) {
    capital.classList.remove("invalid");
    capital.classList.add("valid");
  } else {
    capital.classList.remove("valid");
    capital.classList.add("invalid");
  }

  // Validate numbers
  if (myInput.value.match(numbers)) {
    number.classList.remove("invalid");
    number.classList.add("valid");
  } else {
    number.classList.remove("valid");
    number.classList.add("invalid");
  }

  // Validate length
  if (myInput.value.length >= minLength) {
    length.classList.remove("invalid");
    length.classList.add("valid");
  } else {
    length.classList.remove("valid");
    length.classList.add("invalid");
  }

  
    // Validate password and confirmPassword
    var passEqualsConfPass = (myInput.value == confirmMyInput.value); // TODO: Change this to the condition that needs to be checked so that the text entered in password equals the text in confirm password
    if (passEqualsConfPass) {
      match.classList.remove("invalid");
      match.classList.add("valid");
    } else {
      match.classList.remove("valid");
      match.classList.add("invalid");
    }

    // Disable or Enable the button based on the elements in classList
    enableButton(letter, capital, number, length, match);
  };
}

function enableButton(letter, capital, number, length, match) {
  var button = document.getElementById("signup_submit_button");
  var condition = ((letter.classList.value == "valid") && (capital.classList.value == "valid") && (number.classList.value == "valid") && (length.classList.value == "valid") && (match.classList.value == "valid")); // TODO: Replace false with the correct condition
  if (condition) {
    button.disabled = false;
    console.log("enabled")
  }
}

function onClickFunction() {
  alert("Yay, you are trying to login");
}
