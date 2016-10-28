+++
categories = ["sp"]
date = "2016-08-24T15:47:25+02:00"
description = "Перенос списков между коллекциями сайтов (+ Person, Lookup поля)"
keywords = []
title = "SP: Перенос списков между коллекциями сайтов (+ Person, Lookup поля)"
draft = false
+++

В этом посте мы рассмотрим пример переноса списка с содержимым между коллекциями сайтов.
"Из коробки" нам доступен следующий вариант: сохраняем список как шаблон (list settings -> save list as template).
Cкачиваем сохранённый шаблон из List Template Gallery, и загружаем его в List Template Gallery на той
коллекции сайтов, где мы хотим восстановить список. 
<!--more-->
Это вариант работает в том случае, если в списке не используются колонки типа Person и Lookup.
Колонки с типом Person будут восстановлены, но значения в этих колонках могут быть искажены.
Значения в колонках типа Person сохраняются как **19;#User Name** (где 19 - ID пользователя, User Name - имя пользователя).
А восстанавливаются значения по ID. ID пользователя уникален в рамках коллекции сайтов. Поэтому при переносе списка на другую
коллекцию сайтов, может оказаться, что этот ID будет присвоен другому пользователю, либо вовсе отсутствовать.

Lookup поле не получится восстановить через List Template. Даже если мы восстановим (предварительно сохранив в качестве шаблона) 
список на который ссылается Lookup поле, значения (в списке с Lookup полем) не будут восстановлены. В шаблоне списка сохраняется
ID списка, на который ссылается колонка. А при восстановлении из шаблона, список получает уникальный ID.    
 
 Чтобы решить проблему с переноcом воспользуемся: [Virto Backup & Recovery Tool](http://download.virtosoftware.com/utils/Virto.BackupAndRecovery.Cmd.zip)  
 Это командная утилита, которая позволяет сохранять/восстанавивать данные в SharePoint Online.

 Для примера я создал два списка: **Test_List** и **Test_List_2**. В список Test_List добавлены два поля:    
 - Person (тип Person or Group)  
 - MyLookup (тип Lookup) - ссылается на поле Title из списка Test_List_2

{{< cdnfigure src="/images/test_list.png" title="" >}}

По умолчанию **Virto Backup & Recovery** сохраняет в backup большое кол-во информации (пользователи, списки, права, группы и т.д.)  
Т.к. нам необходимо перенести только два списка, потребуется создать конфигурационный файл.

Находим в папке с утилитой (virtobr.exe) файл **Config.xml**. И копируем его с новым названием, например **TestConfig.xml**.  
Открываем TestConfig.xml в любом текстовом редакторе (я использую [VS Code](https://code.visualstudio.com))

{{< cdnfigure src="/images/testconfig_before.png" title="TestConfig.xml до изменений." >}}

Для нашего примера заменим все значения **true** на **false**, за исключением **SiteUsers** и **WebLists**.  
Параметр SiteUsers необходим для того, чтобы утилита смогла правильно перенести пользователей (либо установить соответствие между ними по User Login).  
А WebLists - для того, чтобы были сохранены списки.  
Так как нам не требуется сохранять все списки, а только два (Test_List и Test_List_2), добавим информацию об этом в наш конфигурационный файл.

```xml
<IncludeFilter>
      <Webs>
        <WebBackupConfig>
          <ServerRelativeUrl>/sites/b</ServerRelativeUrl>
          <Lists>
            <ListBackupConfig>
              <Title>Test_List</Title>
            </ListBackupConfig>
            <ListBackupConfig>
              <Title>Test_List_2</Title>
            </ListBackupConfig>
          </Lists>
        </WebBackupConfig>
      </Webs>
    </IncludeFilter>
``` 

**ServerRelativeUrl** - относительный адрес сайта, на котором находятся списки.  
Ниже примеры значений:  
https://testportal.sharepoint.com, значение **/** (главный сайт)  
https://testportal.sharepoint.com/subsite, значение **/subsite** (подсайт)
https://testportal.sharepoint.com/sites/testsite, значение **/sites/testsite**   

Итоговое содержимое xml-файла TestConfig.xml:
```xml 
<?xml version="1.0"?>
<GlobalOptions xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <BackupConfig>
    <Recursive>false</Recursive>
    <SiteGroups>false</SiteGroups>
    <SiteOwners>false</SiteOwners>
    <SiteUsers>true</SiteUsers>
    <WebContentTypes>false</WebContentTypes>
    <WebFields>false</WebFields>
    <WebLists>true</WebLists>
    <WebRoleDefinition>false</WebRoleDefinition>
    <WebRoleAssignments>false</WebRoleAssignments>
    <IncludeFilter>
      <Webs>
        <WebBackupConfig>
          <ServerRelativeUrl>/sites/b</ServerRelativeUrl>
          <Lists>
            <ListBackupConfig>
              <Title>Test_List</Title>
            </ListBackupConfig>
            <ListBackupConfig>
              <Title>Test_List_2</Title>
            </ListBackupConfig>
          </Lists>
        </WebBackupConfig>
      </Webs>
    </IncludeFilter>
  </BackupConfig>
  <RestoreConfig>
  </RestoreConfig>
</GlobalOptions>
```

Теперь запускаем cmd.exe (win -> cmd.exe), и переходим в папку с утилитой **Virto Backup & Recovery**  
(В VS Code можно нажать **F1**, ввести **Create new intergrated terminal**, нажать enter)  

Запускаем **virtobr.exe** с параметрами:     
virtobr.exe -o backup -s https://testportal.sharepoint.com/sites/b -d c:\TestBackup -u mylogin@testportal.com -p MyP@$sWoRD1 `--`ConfigPath TestConfig.xml
    
**-o** : тип выполняемой операции (backup,recovery)  
**-s** : адрес сайта (либо папки, для операции recovery)  
**-d** : адрес папки (сайта, для операции recovery), в которую будет сохранён backup (папка будет создана автоматически и к ней будет добавлен TimeStamp (например TestBackup**_201608251011**))  
**-u** : логин пользователя, для подключения к SharePoint  
**-p** : пароль пользователя, для подключения к SharePoint  
**`--`ConfigPath** : название конфигурационного файла (если не указать, будет использоваться стандартный Config.xml)

В результате выполнения команды будет создана папка (вида TestBackup**_201608251011**), в которой будут файлы
для созданного backup.

Для того, чтобы восстановить (перенести) сохранённые списки, потребуется запустить утилиту ещё раз, с небольшими изменениями в параметрах:  
virtobr.exe -o recovery -s "c:\TestBackup_201608251011" -d "https://testportal.sharepoint.com/sites/c" -u mylogin@testportal.com -p MyP@$sWoRD1

В качестве операции (-o) указываем **recovery**, источником (-s) теперь служит адрес папки с backup, а назначением (-d) - адрес другой коллекции сайтов.  
Указывать конфигурационный файл не требуется.

После того, как восстановление будет выполнено, проверим результат:
{{< cdnfigure src="/images/test_list_recovery.png" title="" >}}

Как видим, у нас появился список с элементами, в которых восстановлены поля типа Lookup и Person.  


