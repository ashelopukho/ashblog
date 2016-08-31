+++
categories = ["sp"]
date = "2016-08-29T12:08:21+02:00"
description = ""
keywords = []
title = "SP Online: Debug Remote Event Receivers + ngrok"
+++

Обычно отладка Remote Event Receivers в SharePoint Online выполняется с помощью Service Bus.
Я писал подробно про это [здесь](http://blog.virtosoftware.com/2014/12/creating-and-debugging-of-remote-event.html) и [здесь](http://blog.virtosoftware.com/2015/01/adding-remote-event-receivers-to-list.html). 
Сегодня мы рассмотрим другой (более простой) путь решения этой задачи.  
<!--more-->

Если коротко, то всё что нам нужно - это использовать **[ngrok](https://ngrok.com/)**  
На странице продукта коротко и ёмко описано его предназначение: ngrok - secure tunnels to localhost.    
 
Первым делом качаем [ngrok](https://ngrok.com/download)  
Распаковываем архив в любую директорию.  
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

#### Программу ngrok не закрываем (туннель работает, пока работает ngrok)  
  
{{< figure src="/images/ngrok-run.png" title="" >}}

**[port]** заменяем на порт, который используется IIS Express для доступа к нашем сайту на localhost.
Порт можно получить выбрав Web-проект и нажав F4. 
{{< figure src="/images/spngrok-addin-localhost-port.png" title="Получаем порт от localhost (для http)" >}}

После запуска ngrok мы получили временный адрес, по которому можно обращаться извне к localhost.  
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

Для того, чтобы обойти эту проблему зарегистриуем наш add-in вручную.
Октроем страницу: [dev_site_url]/_layouts/appregnew.aspx,  
Где [dev_site_url] - адрес сайта, на котором будет тестироваться приложение  
(например: https://testportal.sharepoint.com/sites/dev/_layouts/appregnew.aspx)  
Нажимаем Generate для создания Client ID и Client Secret. В качестве доменного App Domain и Redirect Url указываем адрес 
полученный при запуске ngrok. После этого жмём кнопку Save и полученную информацию сохраняем куда-нибудь в текстовый файл
(чтобы не потерять Client Secret).  

{{< figure src="/images/spngrok-reg-addin.png" title="" >}}

Вернёмся в Visual Studio, выбираем web-проект, и устанавливаем для него **Set as StartUp Project**. Открываем файл web.config
и заменяем в appSettings ClientId и ClientSecret на сгенерированные значения.
Далее нажимаем правой кнопкой по add-in проекту и выбираем **Publish...**.  
В **Current profile:** выбираем **New..**. Затем **Create new profile**.
Вводим любое слово для Profile Name (например, spNgrokProfile). Нажимаем кнопку **Next**.
Далее вводим Client ID и Client Secret, полученные на странице **appregnew.aspx**.
И жмём кнопку **Finish**. После этого мы можем собрать add-in: нажимаем **Package the add-in**

В открывшемся окне вводим https адрес ngrok-туннелля, и проверяем Client ID. Далее **Finish**.
После сборки add-in откроется папка с app-файлом. Далее открываем в браузере dev-сайт -> Site Contents -> 
открываем библиотеку **App Packages**. Нажимаем кнопку Upload и загружаем app-файл.

{{< figure src="/images/spngrok-apppackages-lib.png" title="" >}} 

Возвращаемся в Visual Studio, нажимаем **F5** (не забываем проверить, что web-проект выбран в качестве StartUp Project).
Итак, к этому моменту у нас залит add-in в App Packages, запущен web-проект в режиме отладки, 
запущен ngrok, и установлен breakpoint в Event Receiver (метод ProcessEvent).
Осталось установить Add-In и убедиться, что breakpoint сработает. Для на dev-сайте переходим в список 
**Apps in Testing** -> нажимаем на **new app to deploy** -> в модальном окне выбираем package: spNgrok ->
адрес (Deploy app to) не меняем -> нажимаем **Deploy** -> далее **Trust It**.

{{< figure src="/images/spngrok-deploy-addin.png" title="" >}}

Вернёмся в **Site Contents** и увидим, что наше приложение устанавливается. 
Установка может занять несколько минут (даже для пустого add-in, и ), поэтому не удивляемся,
что наш breakpoint ещё не сработал. Ждём...

{{< figure src="/images/spngrok-addin-install-inprogress.png" title="In Progress" >}}

И вот спустя несколько минут срабатывает breakpoint:

{{< figure src="/images/spngrok-fire-breakpoint.png" title="Breakpoint" >}}

Нажимаем **F5** для прололжения выполнения работы программы, и ловим исключение: **AudienceUriValidationFailedException**

{{< figure src="/images/spngrok-audience-exception.png" title="Audience Exception" >}}

В ошибке говорится, что-то про localhost. Ок. Для того, чтобы решить эту проблему нам необходимо выполнить
последний шаг. Открываем web.config нашего web-проекта и добавляем в **appSettings** следующую строчку:    
**```<add key="HostedAppHostNameOverride" value="e1e1e1e1e.ngrok.io;localhost"/>```**
(Замените **e1e1e1e1e.ngrok.io** на ваш адрес ngrok-туннеля без https префикса)  
При сохранении web.config, Visual Studio сообщит, что необходимо выйти из debug-режима. Нажимаем OK.
Снова нажимаем **F5**. Возвращаемся в Site Contents и видим, что при установке возникла ошибка:
**Sorry, something went wrong with adding the app. Click to retry.**  
Нажимаем **Click to retry** и ждём срабатывание breakpoint.    

{{< figure src="/images/spngrok-final-breakpoint-ok.png" title="Breakpoint сработал. ClientContext не равен null" >}}

Цель достигнута. ngrok отлично подходит для отладки Remote Event Receivers списков и элементов, webhooks, httpsend action.
Так же можно использовать его для демонстрации работы add-in без развёртывания приложения на внешний хостинг.
Минусом является то, что в бесплатной версии ngrok-туннель живёт, пока не закрыто приложение ngrok. 
В платной версии можно создавать постоянные адреса.   
 