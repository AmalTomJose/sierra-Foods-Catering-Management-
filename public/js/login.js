
const name = document.getElementById('username');
const nameError = document.getElementById('nameError');
const password = document.getElementById('password');
const passwordError = document.getElementById('passwordError');
const form=document.getElementById('form');
const formError = document.getElementById('formError');

// function validateEmail(){
//     if(name.value == '' || null)
//     {
//         nameError.style.visibility="visible";
//         return false
//     }
//     else
//     {
//         nameError.style.visibility="hidden";
//         return true;
//     }
// }
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

function validatePassword(){
    if(password.value === '' || null)
        {
            passwordError.style.visibility="visible";
            return false
        }
        else
        {
            passwordError.style.visibility="hidden";
            return true;
        }
}

form.addEventListener('submit',(e)=>{
    if(!validateUserName() || !validatePassword())
    {
        e.preventDefault()
        formError.style.visibility="visible"
        setTimeout(()=>formError.style.visibility="hidden",3000)
    }
})