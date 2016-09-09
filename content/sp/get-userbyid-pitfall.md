+++
categories = ["sp"]
date = "2016-09-09T08:25:58+02:00"
description = ""
keywords = []
title = "SP.CSOM.Pitfalls: UserCollection"
+++

Что будет выведено на экран после выполнения следующего кода?
<!--more-->

```csharp
var byEmail = Context.Web.SiteUsers.GetByEmail("user1@ashblog.ru");
var byID = Context.Web.SiteUsers.GetById(10); 

Context.Load(byEmail, u => u.Title);
Context.Load(byID, u => u.Title);
Context.ExecuteQuery();

var byEmail2 = Context.Web.SiteUsers.GetByEmail("user1@ashblog.ru");
var byID2 = Context.Web.SiteUsers.GetById(10);

var titleByEmail2 = byEmail2.Title;
var titleByID2 = byID2.Title;

Console.WriteLine(email);
Console.WriteLine(byid);
```

В первых двух строках мы запрашиваем пользователя по Id и Email.  
Затем указываем, что необходимо проинициализировать свойство Title для возвращаемого объекта User.
И выполняем запрос - ExecuteQuery.   
Если мы попробуем сейчас вывести значение свойства Title для переменных
byEmail и byID - то увидим два одинаковых значения.  

Следующие две строки идентичны первым двум, за исключением того, что пользователя мы присваиваем другим переменным (byEmail2, byID2).
Мы не выполняем дополнительный запрос ExecuteQuery(), т.к. ожидаем, что свойство SiteUsers уже проинициализировано.
Далее присваиваем значение свойства Title переменным titleByEmail2 и titleByID2. 
И выводим значения на экран. Однако при запуске этого кода, мы получим исключение  
*The property or field has not been initialized.*  
в строке:  
*var titleByID2 = byID2.Title;*

Оказывается, что метод GetById не ищет пользователя в проинициализированной коллекции.
В этом методе всегда создаётся запрос на получение нового значения (пользователя).
Именно, из-за этого возникло исключение, т.к. для "нового" пользователя мы не отправляли
запрос на сервер и не запрашивали свойство Title.





 

