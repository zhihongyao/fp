window.onhashchange = switchHash;
$(function() {
	isOAuth();
	switchHash();
});
const Hashs = {
	'#list': {
		title: '开票助手',
		fn: loadTitles
	},
	'#detail': {
		title: '抬头详情'
	},
	'#edit': {
		title: '编辑抬头'
	}
},
Key = {
	'OpenID': 'OpenID',
	'AppID': 'wxc59832dca9acf662'
},
Fields = ['input-id', 'input-name', 'input-duty', 'input-address', 'input-phone', 'input-bank', 'input-account'];
//let openId;
function isOAuth() {
	let openId = sessionStorage.getItem(Key.OpenID);
	let code = getQueryString('code');
	if (!openId) {
		if (code) {
			$.ajax({
				url: 'service/oauth',
				method: 'POST',
				data: {
					code: code
				},
				dataType: 'JSON',
				success: function(data) {
					sessionStorage.setItem(Key.OpenID, data['openId']);
					location.href = 'http://fapiao.vancode.cn/'
					//openId = data['openId'];
					//loadTitles();
				}
			});
			return;
		}
		let url = encodeURIComponent('http://fapiao.vancode.cn/');
		url = 'https://open.weixin.qq.com/connect/oauth2/authorize'
			+ '?appid=' + Key.AppID + '&redirect_uri=' + url
			+ '&response_type=code&scope=snsapi_base&state=fp#wechat_redirect';
		location.href = url;
	}
}
function getQueryString(name) {
	let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
	let r = window.location.search.substr(1).match(reg);
	if (r != null)
		return decodeURI(r[2]);
	return null;
}
function switchHash() {
	hideAllPage();
	hideFull();
	let id = location.hash || '#list';
	$(id).show();
	document.title = Hashs[id]['title'];
	Hashs[id]['fn'] && Hashs[id]['fn']();
}
function hideAllPage() {
	for(let key in Hashs) {
		$(key).hide();
	}
}
function makeCode(item) {
	$('#qrcode').empty();
	let text = String.fromCharCode(0xFEFF) + '11' + item['name'] + '→2' + item['duty']
		+ (item['type'] == 0 ? '→3'+item['address']+' '+item['phone']+'→4'+item['bank']+' '+item['account'] : '') + '→';
	console.log(text);
	text = utf16to8(text);
	$('#qrcode').qrcode({
		text: text,
		type: 'cn',
	});
	let $canvas = document.getElementsByTagName('canvas')[0],
		dataUrl = $canvas.toDataURL();
	$('#qrcode').html('<img src="'+dataUrl+'" onclick="showFull()"/>');
	$('.weui-gallery__img').css({
		'bottom': '0',
		'padding': '12.5%',
		'background-image': 'url("' + dataUrl + '")',
		'background-color': '#fff',
		'background-origin': 'content-box',
	});
}
function showFull() {
	$('.weui-gallery').show();
}
function hideFull() {
	$('.weui-gallery').hide();
}
function utf16to8(str) {
	let out, i, len, c;
	out = '';
	len = str.length;
	for(i = 0; i < len; i++) {
		c = str.charCodeAt(i);
		if((c >= 0x0001) && (c <= 0x007F)) {
			out += str.charAt(i);
		} else if(c > 0x07FF) {
			out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
			out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
			out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
		} else {
			out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
			out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
		}
	}
	return out;
}
function loadTitles() {
	let openId = sessionStorage.getItem(Key.OpenID);
	if (!openId) {
		return;
	}
	$.ajax({
		url: 'service/invoiceTitle/get',
		method: 'POST',
		data: {openid: openId},
		dataType: 'JSON',
		success: function(list) {
			appendTitleHtml(list);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
		},
		beforeSend: function(XMLHttpRequest) {
			showLoading();
		},
		complete: function(XMLHttpRequest, textStatus) {
			hideLoading();
		}
	});
}
function appendTitleHtml(list) {
	let arr = [];
	list.forEach(function(item) {
		arr.push(
			 '<div class="weui-cells" data-value=\''+JSON.stringify(item)+'\'>'
			+	'<div class="weui-cell access" onclick="detail(this)">'
			+		'<div class="weui-cell__bd list-item-name">'
			+			item['name']
			+		'</div>'
			+		'<div class="weui-cell__ft">'
			+			(item['type'] == 0 ? '增专票' : '增普票')
			+		'</div>'
			+	'</div>'
			+	'<div class="weui-cell">'
			+		'<div class="weui-cell__bd isdefault">'
			+			(item['isdefault'] == 1 ? '默认' : '')
			+		'</div>'
			+		'<div class="weui-cell__ft">'
			+			'<img class="icon-edit" src="img/edit.svg" onclick="edit(this)"/>'
			+			'<img class="icon-del" src="img/del.svg" onclick="del(this, \''+item['id']+'\')"/>'
			+		'</div>'
			+	'</div>'
			+'</div>'
		);
	});
	$('#titles').html(arr.join(''));
}
function detail(elem) {
	item = JSON.parse($(elem).parents('.weui-cells').attr('data-value'));
	$('#detail .input-name').text(item['name']);
	$('#detail .input-type').text(item['type'] == 0 ? '增专票' : '增普票');
	$('#detail .input-duty').text(item['duty']);
	$('#detail .input-address').text(item['address']);
	$('#detail .input-phone').text(item['phone']);
	$('#detail .input-bank').text(item['bank']);
	$('#detail .input-account').text(item['account']);
	if (item['type'] == 0) {
		$('#detail .type-0').removeClass('hide');
	} else {
		$('#detail .type-0').addClass('hide');
	}
	location.hash = 'detail';
	makeCode(item);
}
function edit(elem) {
	item = JSON.parse($(elem).parents('.weui-cells').attr('data-value'));
	clearInput();
	setInput(item);
	$('#edit .weui-btn_primary').on('click', function() {
		update();
	});
	location.hash = 'edit';
}
function add() {
	clearInput();
	$('#edit .weui-btn_primary').on('click', function() {
		update();
	});
	location.hash = 'edit';
}
function setInput(item) {
	$('#edit .input-id').val(item['id']);
	$('#edit .input-type').val(item['type']);
	$('#edit .checkbox.checked').removeClass('checked');
	if (item['type'] == 0) {
		$('#edit .type-0').removeClass('hide');
		$('#edit #type0 .checkbox').addClass('checked');
	} else {
		$('#edit .type-0').addClass('hide');
		$('#edit #type1 .checkbox').addClass('checked');
	}
	$('#edit .input-name').val(item['name']);
	$('#edit .input-isdefault')[0]['checked'] = item['isdefault'] == 1 ? true : false;
	$('#edit .input-duty').val(item['duty']);
	$('#edit .input-address').val(item['address']);
	$('#edit .input-phone').val(item['phone']);
	$('#edit .input-bank').val(item['bank']);
	$('#edit .input-account').val(item['account']);
}
function update() {
	let id = $('#edit .input-id').val(),
		type = $('#edit .input-type').val(),
		name = $('#edit .input-name').val(),
		isdefault = $('#edit .input-isdefault')[0]['checked'] ? 1 : 0,
		duty = $('#edit .input-duty').val(),
		address = $('#edit .input-address').val(),
		phone = $('#edit .input-phone').val(),
		bank = $('#edit .input-bank').val(),
		account = $('#edit .input-account').val();
	if (!name) {
		showToast('请输入发票抬头');
		return;
	}
	if (type == 0) {
		if (!(duty.length == 15 || duty.length == 18 || duty.length == 20)) {
			showToast('税号长度为15位、18位、20位');
			return;
		}
		if (!address) {
			showToast('请输入单位注册地址');
			return;
		}
		if (!phone) {
			showToast('请输入公司电话号码');
			return;
		}
		if (!bank) {
			showToast('请输入收票单位开户银行');
			return;
		}
		if (!account) {
			showToast('请输入收票单位银行账号');
			return;
		}
	} else {
		address = '';
		phone = '';
		bank = '';
		account = '';
	}
	$.ajax({
		url: 'service/invoiceTitle/update',
		method: 'POST',
		data: {
			openid: sessionStorage.getItem(Key.OpenID),
			//openid: openId,
			id, type, name, isdefault, duty, address, phone, bank, account
		},
		dataType: 'JSON',
		success: function(data) {
			if (data['result'] == 0) {
				showToast('发票信息保存成功', function() {
					history.back();
				});
			} else {
				showToast('发票信息保存失败，请稍后重试');
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			showToast('发票信息保存失败，请稍后重试');
		},
		beforeSend: function(XMLHttpRequest) {
			showLoading('发票信息保存中');
		},
		complete: function(XMLHttpRequest, textStatus) {
			hideLoading();
		}
	});
}
function clearInput() {
	Fields.forEach(function(item) {
		$('#edit .' + item).val('');
	});
	$('#edit .weui-btn_primary').off('click');
	$('#edit .type-0').removeClass('hide');
	$('#edit .checkbox.checked').removeClass('checked');
	$('#edit #type0 .checkbox').addClass('checked');
	$('#edit .input-type').val(0);
	$('#edit .input-isdefault')[0]['checked'] = false;
}
function del(elem, id) {
	confirmWeUI('是否要删除抬头', function() {
		$.ajax({
		url: 'service/invoiceTitle/delete',
		method: 'POST',
		data: {
			id: id
		},
		dataType: 'JSON',
		success: function(data) {
			if (data['result'] == 0) {
				showToast('删除成功', function() {
					$(elem).parents('.weui-cells').remove();
				});
			} else {
				showToast('删除失败，请稍后重试');
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			showToast('删除失败，请稍后重试');
		},
		beforeSend: function(XMLHttpRequest) {
			showLoading('正在删除抬头');
		},
		complete: function(XMLHttpRequest, textStatus) {
			hideLoading();
		}
	});
	});
}
function triggerType(elem, type) {
	$('.checkbox.checked').removeClass('checked');
	$(elem).find('.checkbox').addClass('checked');
	if (type == 0) {
		$('#edit .type-0').removeClass('hide');
		$('#edit .input-type').val(0);
	} else {
		$('#edit .type-0').addClass('hide');
		$('#edit .input-type').val(1);
	}
}
function alertWeUI(msg, callback) {
	appendAlertDialog(msg);
	$('.weui-dialog__btn_primary').on('click', function(){
		hideDialog();
		callback && callback();
	});
}
function confirmWeUI(msg, callback, cancel) {
	appendConfirmDialog(msg);
	$('.weui-dialog__btn_primary').on('click', function(){
		hideDialog();
		callback && callback();
	});
	$('.weui-dialog__btn_default').on('click', function(){
		hideDialog();
		cancel && cancel();
	});
}
function appendAlertDialog(msg) {
	let html = 
		 '<div class="js_dialog">'
		+	'<div class="weui-mask"></div>'
		+	'<div class="weui-dialog">'
		+		'<div class="weui-dialog__bd">' + msg + '</div>'
		+		'<div class="weui-dialog__ft">'
		+			'<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary">知道了</a>'
		+		'</div>'
		+	'</div>'
		+'</div>';
	$('body').prepend(html);
}
function appendConfirmDialog(msg) {
	let html = 
		 '<div class="js_dialog">'
		+	'<div class="weui-mask"></div>'
		+	'<div class="weui-dialog">'
		+		'<div class="weui-dialog__bd">' + msg + '</div>'
		+		'<div class="weui-dialog__ft">'
		+			'<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'
		+			'<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'
		+		'</div>'
		+	'</div>'
		+'</div>';
	$('body').prepend(html);
}
function showDialog(selector) {
	$(selector || '.js_dialog').show();
}
function hideDialog(selector) {
	$(selector || '.js_dialog').remove();
}
function showLoading(msg) {
	msg = msg || '数据加载中';
	let html = 
		 '<div id="loadingToast">'
	    +    '<div class="weui-mask_transparent"></div>'
	    +    '<div class="weui-toast">'
	    +        '<i class="weui-loading weui-icon_toast"></i>'
	    +        '<p class="weui-toast__content">'+msg+'</p>'
	    +    '</div>'
	    +'</div>';
	$('body').prepend(html);
}
function hideLoading() {
	$('#loadingToast').remove();
}
function showToast(msg, callback) {
	msg = msg || '操作完成';
	let html = 
		 '<div id="msgToast">'
	    +    '<div class="weui-mask_transparent"></div>'
	    +    '<div class="weui-toast">'
	    +        '<p class="weui-toast__content">'+msg+'</p>'
	    +    '</div>'
	    +'</div>';
	$('body').prepend(html);
	setTimeout(function() {
		hideToast();
		callback && callback();
	}, 2000);
}
function hideToast() {
	$('#msgToast').remove();
}
