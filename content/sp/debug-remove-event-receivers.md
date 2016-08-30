+++
categories = ["sp"]
date = "2016-08-29T12:08:21+02:00"
description = ""
keywords = []
title = "SP Online: Debug Remote Event Receivers + ngrok"
draft = true
+++

Обычно отладка Remote Event Receivers в SharePoint Online выполняется с помощью Service Bus.
Я писал подробно про это [здесь](http://blog.virtosoftware.com/2014/12/creating-and-debugging-of-remote-event.html) и [здесь](http://blog.virtosoftware.com/2015/01/adding-remote-event-receivers-to-list.html). 
Сегодня мы рассмотрим другой (более простой) путь решения этой задачи.  
<!--more-->

Если коротко, то всё что нам нужно - это использовать **[ngrok](https://ngrok.com/)**  
На странице продукта, коротко и ёмко описано его предназначение: ngrok - secure tunnels to localhost.  

Итак начнём. 
Первым делом качаем [ngrok](https://ngrok.com/download)  
Распаковываем архив любую директорию.  
  
Открываем Visual Studio и создаём проект SharePoint Add-In (Provider-Hosted).   
Кликаем мышкой по имени add-in project (не web) -> нажимем F4.   
Выбираем **true** для параметра **Handle add-in installed**  
{{< figure src="/images/spngrok-addin-installed-rer.png" title="Handle add-in installed" >}}

В результате предыдущего действия будет создан **.svc** сервис, который будет вызываться после того,
как наше решение будет установлено на портале. 
Этот сервис является примером удалённого обработчика данных (Remote Event Receiver).

Если на данном этапе нажать F5, то мы получим предупреждение от Visual Studio, о том, мы мы не сможем 
отлаживать Remote Event Receivers, т.к. для этого необходимо настроить Service Bus.  
{{< figure src="/images/spngrok-addin-servicebus-msg.png" title="Предупреждение: MS Service Bus Connection" >}} 

В процессе отладки адресом нашего приложения будет localhost, который недоступен извне. 
Именно поэтому в Visual Studio появилось сообщение о настройке Service Bus. 

ngrok позволит решить нам эту проблему.  
Итак, открываем папку с **ngrok.exe** и запускаем команду   
**ngrok http -host-header="localhost:[port]" [port]**  

{{< figure src="/images/ngrok-run.png" title="" >}}

**[port]** заменяем на порт, который используется IIS Express для доступа к нашем сайту на localhost.
Порт можно получить выбрав Web-проект и нажав F4. 
{{< figure src="/images/spngrok-addin-localhost-port.png" title="Получаем порт от localhost (для http)" >}}

После запуска ngrok мы получили временный адрес, по которому можно обращаться извне к localhost.  
Программу ngrok не закрываем (туннель работает, пока работает ngrok).  
Нажимаем правой кнопкой мыши по web-проекту, выбираем **Set as StartUp Project**. Жмём **F5**  
{{< figure src="/images/set-as-startup-project.png" title="Set as StartUp Project" >}}

Открываем любой браузер и вводим адрес туннеля (используем https, https://e1e1e1e1e.ngrok.io)
В результате получим окно вида:
{{< figure src="/images/ngrok-access-ok.png" title="" >}}

Отлично, наш компьютер доступен извне. Теперь любой желающий может получить доступ к нашему
сайту, зная ngrok-адрес. На картинке выше мы видим стандартное сообщение об ошибке, которое 
появилось в SharePointContextFilter.

Попробуем запустить add-in в режиме отладки. Для этого вернём тип запуска проекта.    
Выбираем в Solution Explorer наше решение, клик правой кнопкой мыши, выбираем **Set StartUp Projects...**  
Выбираем **Multiple startup projects**, нажимаем **OK**

Теперь необходимо открыть и изменить файл **AppManifest.xml**, для того, чтобы сменить адрес, по которому будет происходить 
обращение к нашему сервису. Выбираем файл в Solution Explorer -> жмём F7.  
Заменяем значение элемента **InstallEventEndpoint** на ngrok-адрес туннеля. 
{{< figure src="/images/ngrok-rer-address.PNG" title="" >}} 

Открываем файл с кодом сервиса **AppEventReceiver.svc.cs**, ставим breakpoint в первойм строчке метода **ProcessEvent**
Запускаем отладку: **F5**  

......ждём............

Ура! Breakpoint сработал.   
Однако, если выполнить шаги дальше, то мы увидим, что **clientContext** равен **null**. Причина в том, что в 
результате запуска в режиме отладки, Visual Studio прописывает localhost адрес в качестве remote endpoint
для нашего приложения.
{{< figure src="/images/ngrok-endpoint-problem.png" title="Почти получилось..." >}}

...продолжение следует...