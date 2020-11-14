var md = window.markdownit();

function previewBlogPost() {
	if (document.getElementById("blogPreview")) {
		document.getElementById("blogPreview").remove()
	}
	var body = JSON.stringify({body: document.getElementsByName("body")[0].value});
	fetch(`//${window.location.host}/blog/preview`, {method: "POST", headers: {"Content-Type": "application/json"}, credentials: "include", body: body})
	.then(response => response.text())
	.then(function(body){
		document.getElementById("blogForm").insertAdjacentHTML("afterend", `
			<div class="ui inverted segment" id="blogPreview">
			<div class="ui huge inverted header">${document.getElementsByName("title")[0].value}
			<div class="sub header timestamp" style="color: rgba(255,255,255,.7);">just now</div>
			</div>

			<p>${body}</p>
			</div>
			`);
	}).catch(function(err){
		console.log(err);
	})
}