
const firstname = document.getElementById('Firstname');
const firstnameError = document.getElementById('FirstnameError');

const lastname=document.getElementById('Lastname');
const lastnameError= document.getElementById('LastnameError');

const email = document.getElementById('email')
const emailError = document.getElementById('emailError')

const phoneno = document.getElementById('phoneno')
const phonenoError = document.getElementById('phonenoError')

const password = document.getElementById('password');
const passwordError = document.getElementById('passwordError');

const confirmpassword = document.getElementById('confirmpassword');
const confirmpasswordError = document.getElementById('confirmpasswordError');

const form=document.getElementById('form');
const formError = document.getElementById('formError');

function validateFirstname(){
    if(firstname.value.trim() === '' || firstname.value === null)
    {
        firstnameError.style.visibility="visible";
        return false;
    }
    else
    {
        firstnameError.style.visibility="hidden";
        return true;
    }
}

function validateLastname(){
    if(lastname.value.trim() === '' || lastname.value === null)
        {
            lastnameError.style.visibility="visible";
            return false;
        }
        else
        {
            lastnameError.style.visibility="hidden";
            return true;
        }
}


function validateEmail(){
    if(email.value.trim() === ''||email.value === null)
        {
            emailError.style.visibility="visible"
            return false
        }
        else if(!email.value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            emailError.style.visibility="visible";
            emailError.innerHTML="enter a valid email"
        }
        else
        {
            emailError.style.visibility="hidden"
            return true
        }
}


// function validatePhoneno(){
//     if(phoneno.value.trim() ===''|| phoneno.value === null ||phoneno.value <10)
//     {
//   phonenoErrorError.textContent = "Enter a valid mobile number";

//         phonenoError.style.visibility="visible"
//         return false
//     }
//     else
//     {
//         phonenoError.style.visibility="hidden"
//         return true
//     }
// }


function validatePhoneno() {
    const phoneno = document.getElementById("phoneno");
    const phonenoError = document.getElementById("phonenoError");
    const phone = phoneno.value.trim();

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
        phonenoError.textContent = "Enter a valid 10-digit mobile number";
        phonenoError.style.visibility = "visible";
        return false;
    } else {
        phonenoError.style.visibility = "hidden";
        return true;
    }
}



function validatePassword(){
    if(password.value.trim() === '' ||password.value === null )//add password.value.length<8
        {
            passwordError.textContent = "Password must be at least 8 characters long";
            passwordError.style.visibility="visible";
            return false
        }
        else
        {
            passwordError.style.visibility="hidden";
            return true;
        }
}

function validateconfirmPassword(){
    if(confirmpassword.value.trim() === '' ||confirmpassword.value === null || confirmpassword.value != password.value)
        {
           
            confirmpasswordError.style.visibility="visible";
            return false;
        }
        else
        {
            confirmpasswordError.style.visibility="hidden";
            return true;
        }
}
form.addEventListener('submit',(e)=>{
     
    if( !validateFirstname() || !validateUsername() || !validatePassword() || !validateEmail() || !validateconfirmPassword()  )
    {
        e.preventDefault()
        formError.style.visibility="visible"
        setTimeout(()=>formError.style.visibility="hidden",3000)
    }
   
})