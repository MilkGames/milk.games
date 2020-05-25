function previewBlogPost() {
	if (document.getElementById("blogPreview")) {
		document.getElementById("blogPreview").remove()
	}
	document.getElementById("blogForm").insertAdjacentHTML("afterend", `
		<div class="ui inverted segment" id="blogPreview">
		<div class="ui huge inverted header">${document.getElementsByName("title")[0].value}
		<div class="sub header timestamp" style="color: rgba(255,255,255,.7);">just now</div>
		</div>

		<p>${document.getElementsByName("body")[0].value}</p>
		</div>
		`);
}