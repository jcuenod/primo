// Set up container to dump data into
const root = document.createElement('div')
root.classList.add("primoextension-container")
root.innerHTML = `
<style>
.primoextension-container {
	z-index: 100;
	position: fixed;
	left: 0;
	top: 0;
	height: 100vh;
	width: 350px;
	transform: translateX(-340px);
	overflow-y: scroll;
	background: #eee;
	transition: transform 150ms ease-in-out;
	padding: 5px;
}
.primoextension-container:hover {
	transform: translateX(0);
}
.primoextension-container > div {
    margin: 5px;
}
.pext-loading {
	display: flex;
	height: 90vh;
	justify-content: center;
	align-items: center;
}
.pext-loading > img {
	width: 48px;
	height: 48px;
}
.primoextension-container .pext-item {
	cursor: pointer;
    margin: 2px;
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 5px;
}
.primoextension-container .pext-item:hover {
	background: #ddd;
}
.pext-title {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-weight: bold;
	font-size: small;
}
.pext-duedate {
	font-size: small;
	color: #888;
}
.pext-duedate.due {
	color: #a00;
	font-weight: bold;
}
</style>
`
document.body.appendChild(root)
const spinnerUrl = browser.runtime.getURL("images/spinner.svg")
const container = document.createElement("div")
container.innerHTML = `
<div class="pext-loading">
	<img src="${spinnerUrl}" />
</div>`
root.appendChild(container)

// Utility functions
const sortLoans = (a,b) => {
	const date = +a.duedate - (+b.duedate)
	if (date !== 0)
		return date
	return a.author.localeCompare(b.author)
}

const NEAR_DUE = 7
const dayMilliseconds = 24 * 60 * 60 * 1000
const nearDue = due => {
	const dueDate = new Date(formatDate(due))
	const today = new Date()
	const dayDifference = new Date(dueDate - today)
	const diffDays = dayDifference.getTime() / dayMilliseconds
	return diffDays < NEAR_DUE
}

const formatDate = duedate => {
	const year = duedate.slice(0, 4)
	const month = duedate.slice(4, 6)
	const day = duedate.slice(6)
	return `${year}-${month}-${day}`
}

const formatLoan = loan => `
<div class="pext-item">
	<div class="pext-title" title="${loan.title}">${loan.title}</div>
	<div class="pext-author">${loan.author}</div>
	<div class="pext-duedate ${nearDue(loan.duedate) ? 'due' : ''}">${formatDate(loan.duedate)}</div>
</div>
`

// Put list into container
const inject = loans => {
	const sortedLoans = loans.sort(sortLoans)
	container.innerHTML = `
		${sortedLoans.map(formatLoan).join("")}
	`
}

// Grab necessary info for getting books...
const jwToken = `Bearer "${window.sessionStorage.primoExploreJwt}"`
const cookie = document.cookie

const r = fetch("https://i-share-whe.primo.exlibrisgroup.com/primaws/rest/priv/myaccount/loans?&bulk=100&inst_code=01CARLI_WHE&lang=en&offset=1&patron_id=87366&type=active", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Authorization": jwToken,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
		"Cookie": cookie
    },
    "referrer": "https://i-share-whe.primo.exlibrisgroup.com/discovery/account?vid=01CARLI_WHE:CARLI_WHE&section=loans&lang=en",
    "method": "GET",
    "mode": "cors"
}).then(r => r.json()).then(r => {
	console.log(r)
	inject(r.data.loans.loan)
})

