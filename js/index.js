window.onhashchange = switchHash;
$(function() {
	switchHash();
});
const Hashs = {
	'#index': {
	},
	'#code': {
	}
},
Fields = ['name', 'duty', 'address', 'phone', 'bank', 'account'];
function switchHash() {
	hideAllPage();
	let id = location.hash || '#index';
	$(id).show();
	Hashs[id]['fn'] && Hashs[id]['fn']();
}
function hideAllPage() {
	for(let key in Hashs) {
		$(key).hide();
	}
}
function makeCode() {
	$('#qrcode').empty();
	location.hash = 'code';
	let text = String.fromCharCode(0xFEFF) + '11' + $('#name').val() + '→2'
		+ $('#duty').val() + '→3'
		+ $('#address').val() + ' ' + $('#phone').val() + '→4'
		+ $('#bank').val() + ' ' + $('#account').val() + '→';
	console.log(text);
	text = utf16to8(text);
	console.log(text);
	$('#qrcode').qrcode({
		text: text,
		type: 'cn',
	});
	let $canvas = document.getElementsByTagName('canvas')[0],
		dataUrl = $canvas.toDataURL();
	$('#qrcode').html('<img src="'+dataUrl+'"/>');
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
