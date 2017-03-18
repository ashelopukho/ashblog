+++
title = "SP.Dev: Установка значений Managed Metadata через REST"
categories = ["sp"]
keywords = []
description = ""
date = "2017-03-07T10:34:23+02:00"
draft = false
+++

В SharePoint REST API нет официальной поддержки для установки значений
полей типа Managed Metadata (Taxonomy).
Но сделать это всё таки можно.
<!--more-->

Итак, для начала нам понадобится список с колонками Managed Metadata и Managed Metadata Multi.

```javascript
const LIST_TITLE = 'MMDataTestList';
// internal field names
const MM_FieldInternalName = 'MM';
const MM_MULTI_FieldInternalName = 'MMMULTI';
```

{{< cdnfigure src="/images/sp/mm-data-first-item.png" title="" >}}

В примере я буду использовать библиотеку sp-pnp-js.
Это позволит сократить кол-во строчек в коде, да и сам код сделает понятней.

При создании колонки типа Managed Metadata (Multi), автоматически создаётся скрытая колонка
типа Note. Её Title состоит из имени соответствующей Managed Metadata колонки + *_0*.
В нашем случае это *MM_0* и *MMMULTI_0*.
И здесь стоит быть внимательным, т.к. если создать колонку c именем *M M*, а затем переименовть её,
например в *My Metadata*, то имя скрытой колонки не изменится, т.е. останется *M M_0*.
Но и здесь кроектся подвох. Дело в том, что если в имени скрытой колонки будут пробелы, то 
с помощью REST ей не получится присвоить значение. 
Таким образом колонки типа Managed Metadata лучше всего создавать так:
сначала создаём колонку с названием из латинских букв без пробелов, а затем переименовываем её
как нам захочется (если необходимо).
Например, мы хотим создать колонку с именем *My Meta*. Сначала создаём колонку с именем *MyMeta*,
затем переименовываем её в *My Meta*. Скрытая колонка будет по-прежнему иметь имя *MyMeta_0*

Ниже приведён пример функции, которая находит скрытые колонки для наших Managed Metadata колонок,
и присваивает их Internal Names переменным *mm_multi_hidden_field, mm_hidden_field*. 

```javascript
let mm_multi_hidden_field;
let mm_hidden_field;

function loadTaxonomyHiddenFields() {
    return $pnp.sp.web.lists.getByTitle(LIST_TITLE).fields.select('Title', 'InternalName').get()
        .then((fields) => {
            mm_hidden_field = _.find(fields, {
                Title: (MM_FieldInternalName + '_0')
            }).InternalName;
            
            mm_multi_hidden_field = _.find(fields, {
                Title: (MM_MULTI_FieldInternalName + '_0')
            }).InternalName;
        });
} 
```          
 
Далее мы напишем функцию, которая скопирует значение Managed Metadata колонок 
из одного элемента списка в другой.

```javascript
function getItemById(listTitle, id) {
    return $pnp.sp.web.lists.getByTitle(listTitle).items.getById(id);
}

export function copyTaxonomyFieldValues(sourceItemID, destItemID) {
    loadTaxonomyHiddenFields()
        .then(() => getItemById(LIST_TITLE, sourceItemID)
            .select(MM_FieldInternalName, MM_MULTI_FieldInternalName).get())
        .then((sourceItem) => {

            let resultValue = {};

            // set single managed metadata field value
            const mm_Value = sourceItem[MM_FieldInternalName];
            const strMMDataValue = mm_Value ? mm_Value.Label + "|" + mm_Value.TermGuid : null;
            resultValue[mm_hidden_field] = strMMDataValue;

            // set multiple managed metadata field value
            const mm_multi_Value = sourceItem[MM_MULTI_FieldInternalName];
            const strMMMultiValue = mm_multi_Value ? _.map(mm_multi_Value.results, f => ('-1;#' + f.Label + '|' + f.TermGuid)).join(';') : null;
            resultValue[mm_multi_hidden_field] = strMMMultiValue;

            console.log(resultValue);

            return resultValue;
        })
        .then((r) => getItemById(LIST_TITLE, destItemID).update(r))
        .then(() => console.log("OK"))
        .catch((err) => console.log(err));
}
```

Первая функция *getItemById* - вспомогательная. Она возвращает элемент из списка.
Давайте разберём функцию *copyTaxonomyFieldValues*.
Сначала мы используем *loadTaxonomyHiddenFields* для получения internal names 
скрытых колонок. Затем загружаем source item.
Далее мы строим строковые значения, для MM и MMMulti, которые будут присвоены
соответствующим скрытым колонкам. Значения для multi и не-multi колонок строятся
по-разному. Для multi мы создаём массив значений и объединяем его в строку с разделителем *;*.
В конце мы вызываем метод update, для обновления dest item. 

{{< cdnfigure src="/images/sp/mm-data-result.png" title="" >}}

Полный пример кода можно найти здесь:
https://github.com/biogenez/sp-rest-taxonomy