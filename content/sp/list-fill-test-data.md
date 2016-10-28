+++
categories = ["sp"]
date = "2016-08-26T09:06:04+02:00"
description = ""
keywords = []
title = "SP.Dev: Генерация тестовых данных. Создание элементов в списке."
draft = false
+++

Создание тестовых данных в SharePoint - одна из тех задач, которая периодически возникает во время:
разработки, тестирования, демонстрации портала.
Сегодня рассмотрим как можно быстро создать список, заполненный случайными данными.
<!--more-->

Для этого нам понадобится nuget package: [SPS.SPRandom.Core](https://www.nuget.org/packages/SPS.SPRandom.Core/)    
Проект пока в статусе Alpha, однако для решения некоторых задач уже может использоваться.  
Для примера, я создал проект в Visual Studio - Console Program.
В "Package Manager Console" пишем команду:   
**Install-Package SPS.SPRandom.Core** 

Заменим код файла Program.cs на следующий:

```c#
using OfficeDevPnP.Core;
using SPS.SPRandom.Core;
using System.Configuration;

namespace SPConsole
{
    class Program
    {
        static void Main(string[] args)
        {
            AuthenticationManager m = new AuthenticationManager();

            var siteUrl = ConfigurationManager.AppSettings["TestSiteUrl"];
            var userLogin = ConfigurationManager.AppSettings["TestUserLogin"];
            var userPassword = ConfigurationManager.AppSettings["TestUserPassword"];

            var listName = "MyTestList";

            using (var context = m.GetSharePointOnlineAuthenticatedContextTenant(siteUrl, userLogin, userPassword))
            {
                //init generator with current sp context
                SPRandomGenerator spGen = new SPRandomGenerator(context);

                //create test list (generic type).
                var testList = spGen.CreateList(context.Web, listName, onlyGenericListBaseType: true);

                //add fields for testList 
                var fieldInternaNames = spGen.CreateFieldsOfSupportedTypes(testList, addPrefixBeforeFieldName: true);

                //create 50 items with random data
                spGen.FillListWithRandomData(testList, 50);

            }
        }
    }
}
```

Итак, сначала мы создаём контекст для подключения к SharePoint Online.   
Затем инициализируем генератор **SPRandomGenerator**.  
Создаём список **CreateList**. Последний параметр указывает, что создать нужно именно список (Generic List). В противном случае герератор может создать либо список, либо библиотеку (для создания библиотеки есть отдeльный метод **CreateLibrary**).  

Следующая строка кода вызывает метод **CreateFieldsOfSupportedTypes**, для того, чтобы создать в списке колонки всех поддерживаемых типов  
*(на момент написания статьи: Integer, Text, Note, DateTime, Choice, Lookup, Boolean, Number, Currency, URL, MultiChoice,.User)*  
Параметр **addPrefixBeforeFieldName** указывает, что к имени колонки будет добавлено название типа колонки. Например: **Text_**DIaxD  

В строке **spGen.FillListWithRandomData(testList, 50);** - вызывается код для создания 50 элементов, которые будут заполнены случайными данными. 
Выполним код и посмотрим результат:

{{< cdnfigure src="/images/spgen_50_items.png" title="Созданный список с элементами." >}}

Проект пока в самом "зачаточном" варианте.  
Код здесь: https://biogenez.github.io/SPS.SPRandom/






