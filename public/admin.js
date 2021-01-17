function previewBlogPost() {
	if (document.getElementById("blogPreview")) {
		document.getElementById("blogPreview").remove()
	}
	var body = JSON.stringify({body: document.getElementsByName("body")[0].value});
	fetch(`//${window.location.host}/admin/blog/preview`, {method: "POST", headers: {"Content-Type": "application/json"}, credentials: "include", body: body})
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

function addTag() {
	var tags = document.getElementsByClassName("tag");
	tags[tags.length-1].insertAdjacentHTML("afterend", `
		<input type="text" class="tag" name="tags[${tags.length+1}]">
		`);
}