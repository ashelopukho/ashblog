var allParas = document.getElementsByTagName('p');
//filter by class name if desired...
for(var i=0;i<allParas.length;i++){
  if( allParas[i].textContent == "" ||
   allParas[i].textContent == "\n"){
    allParas[i].style.display = 'none';
  }
}