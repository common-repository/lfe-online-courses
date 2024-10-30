//var tinyMCEPopup = { close: function(){}, execCommand: function(){}, getWindowArg: function(){} };

(function() {
    var SERVER_URL = 'http://apps.lfe.com/WidgetEndPoint/Plugin/UserScript?';
    var SAVE_STORE_URL= 'http://apps.lfe.com/WidgetEndPoint/Plugin/SaveNewStore?';
    var installId = null;
    var helpVisible = false,
        buttonsEnabled = false,
        selected = { Store: {} },
        serverData = null;

    function buildQuery(obj) {
        var query = '';
        if (!obj) return query;
        for (var key in obj)
            query += '&' + key + '=' + obj[key];
        return query.length > 0 ? query.substr(1) : query;
    }
    function getJsonp(url, query, onSuccess, onFail) {
        query += '&callback=?';
        $.getJSON(url + query)
            .done(function(data, status, xhr) {
                if (data.error)
                    onFail(data);
                else
                    onSuccess(data);
            }).fail(function(err, status, xhr) {
                onFail(err);
            }).always(function(data, status, xhr) { });
    }
    function showMessage(msg, url) {
        $('#msgCont').css('display', 'block');
        if (url)
            $('#divMsg').html('<a target="_blank" href="' + url + '">' + msg + '<a/>');
        else
            $('#divMsg').html(msg);
    }
    function hideMessage() {
        $('#msgCont').css('display', 'none');
    }
    function setCurrencyLabel(currencyId) {
        var i = 0, currName = currencyId;
        if (serverData && serverData.currencies) {}
            for (; i < serverData.currencies.length; i++)
                if (serverData.currencies[i].CurrencyId == currencyId) {
                    currName = serverData.currencies[i].Symbol + ' ' + serverData.currencies[i].CurrencyName;
                    break;
                }
        $('#lfeExistCurrency').html('Store Currency: ' + currName + '.');
    }

    function helpToggle(enable) {
        helpVisible = enable != undefined ? enable : helpVisible;
        $('#lfeHelp').css('display', helpVisible ? 'block' : 'none');
        helpVisible = !helpVisible;
    }

    function buttonsEnable(enable) {
        if (enable == buttonsEnabled) return;
        buttonsEnabled = enable;
        enable ? $('#lfeButtons').removeClass('dis').addClass('en') : $('#lfeButtons').removeClass('en').addClass('dis');
        if (enable) {
            $('#lfebtnCancel').click(function(e) {
                tinyMCEPopup.close();
            });
            $('#lfebtnContinue').click(function(e) {
                selected.StoreName = $('#lfeStoreName')[0].value;

                var data = {
                    TrackingID: serverData.newStore.TrackingID,
                    Name: selected.StoreName,
                    DefaultCurrencyId: selected.Action == 'ADD' ? selected.CurrencyId : selected.Store.CurrencyId,
                    uid:installId,
                    srcId: selected.Action == 'ADD' ? null : selected.Store.StoreId
                };
                //console.log(data);

                getJsonp(SAVE_STORE_URL, buildQuery(data), 
                    function(res) {
                        //console.log(res);
                        if (res.success)
                            /*alert(serverData.newStore.TrackingID);*/
                            if (tinyMCEPopup.execCommand('mceInsertContent', false, generateWidgetIframe(serverData.newStore.TrackingID))) {
                                tinyMCEPopup.close();
                            }
                        else
                            showMessage(res.error);
                    },
                    function(err) {
                        showMessage('server error: ' + (err.error ? err.error : err));
                        //console.log(err);
                    }
                );

            });
        }
        else {
            $('#lfebtnCancel').unbind('click');
            $('#lfebtnContinue').unbind('click');
        }
    }
    
    function showNewStore(show) {
        $('#lfeCopyCont').css('display', 'none');
        $('#lfeCurrencyCont').css('display', 'block');
        $('#lfeExistCurrency').css('display', 'none');
        showInputs(show);
    }
    function showCopyStore(show) {
        $('#lfeCopyCont').css('display', 'block');
        $('#lfeCurrencyCont').css('display', 'none');
        $('#lfeExistCurrency').css('display', 'block');
        showInputs(show);
    }
    function showInputs(show) {
        $('.inpCont').each(function() {
            $(this).css('visibility', show ? 'visible' : 'hidden');
        });
    }
    
    function onRadioChange(e) {
        switch (e.target.id) {
            case 'lferadioAdd' : 
                showNewStore(true);
                selected.Action = 'ADD';
                break;
            case 'lferadioCopy' : 
                showCopyStore(true);
                selected.Action = 'COPY';
                break;
        }
    }
    
    function attachEvents() {
        $('#lfebtnHelp').click(function(e) { helpToggle(); });
        $('#lferadioCopy').change(onRadioChange);
        $('#lferadioAdd').change(onRadioChange);
    }

    function setDefaultRadioButton() {
        document.getElementById('lferadioAdd').click();
    }

    function setStoresDDL(data) {
        var lfeStores = $("#lfeStores").data("kendoDropDownList");
        $("#lfeStores").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "StoreId",
            dataSource: data,
            index: 0,
            change: function(e) {
                var value = $("#lfeStores").val();
            },
            select: function(e) {
                setCurrencyLabel(data[e.item.index()].DefaultCurrencyId);
                selected.Store.StoreId = data[e.item.index()].StoreId;
                selected.Store.CurrencyId = data[e.item.index()].DefaultCurrencyId;
            }
        });
        lfeStores.select(0);
        setCurrencyLabel(data[0].DefaultCurrencyId);
        selected.Store.StoreId = data[0].StoreId;
        selected.Store.CurrencyId = data[0].DefaultCurrencyId;
    }
    
    function setCurrencyDDL(data) {
        if (!data.currencies || data.currencies.length == 0)
            return;

        var index = 0;
        if (data.newStore && data.newStore.DefaultCurrencyId) {
            for (; index<data.currencies.length; index++)
                if (data.currencies[index].CurrencyId == data.newStore.DefaultCurrencyId) 
                    break;
        }
        index = index < data.currencies.length ? index : 0;

        $("#lfeCurrency").kendoDropDownList({
            dataTextField: "CurrencyName",
            dataValueField: "CurrencyId",
            dataSource: data.currencies,
            index: index,
            change: function() {
                var value = $("#lfeStores").val();
            },
            select: function(e) {
                setCurrencyLabel(data.currencies[e.item.index()].CurrencyId);
                selected.CurrencyId = data.currencies[e.item.index()].CurrencyId;
            }
        });

        selected.CurrencyId = data.newStore.DefaultCurrencyId;
    }

    attachEvents();
    helpToggle(false);
    showNewStore(false);
    setDefaultRadioButton();
    buttonsEnable(false);


    $(document).ready(function() {

        $('#msgCont .close').click(function(e){
            hideMessage();
        });

        $("#lfeCurrency").kendoDropDownList();
        $("#lfeStores").kendoDropDownList();

        if (tinyMCEPopup.getWindowArg("guid")) {
            installId = tinyMCEPopup.getWindowArg("guid");
        } else {
            showMessage("Something goes wrong, uid missing, try to reinstall the plugin.");
            return;
        }

        getJsonp(SERVER_URL, 'uid=' + installId,
            function(data) {
                buttonsEnable(true);
                serverData = data;
                //console.log(serverData);
                if (serverData.linkMessage)
                {
                    if (serverData.status) {
                        showMessage(serverData.linkMessage, tinyMCEPopup.getWindowArg("options_url"));
                    }
                    else {
                        showMessage(serverData.linkMessage, serverData.linkUrl);
                    }
                }

                if (serverData) 
                    setCurrencyDDL(serverData);
                if (serverData.stores && serverData.stores.length > 0) 
                    setStoresDDL(serverData.stores);
            },
            function(err) {
                //console.log(err);
            }
        );
    });

    function generateWidgetIframe(trackingId) {
        return "<iframe width='960' height='1000' src='" + tinyMCEPopup.getWindowArg("base_url") + "/Widget/" + trackingId
            + "' allowtransparency frameborder='0'></iframe>";
    }
}());