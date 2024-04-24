const setphone_num  = ''; // ใส่เบอร์โทร อย่าง 065236XXXX
const jwt_secret    = ''; // JWT Key ที่แถมมากับ Truewallet เปิดใช้งาน Webhook

async function decodeJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
      throw new Error('JWT must have 3 parts: header, payload, and signature');
  }

  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));
  const signature = decodeBase64Url(parts[2], true);

  if (header.alg !== 'HS256') {
      throw new Error('Unsupported JWT algorithm');
  }

  const data = parts[0] + '.' + parts[1];
  const valid = await verifySignature(data, signature, secret);

  return {
      header,
      payload,
      verified: valid
  };
}

function decodeBase64Url(str, raw = false) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
      base64 += '=';
  }
  const bytes = atob(base64);
  if (raw) {
      return bytes;
  }
  return decodeURIComponent(bytes.split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

async function verifySignature(data, signature, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signatureBytes = new Uint8Array(Array.from(signature).map(c => c.charCodeAt(0)));
  const dataBytes = encoder.encode(data);
  return await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes);
}

const lib_create_tw_mini = `const TrueQR_SET="00020101021229390016A000000677010111031514000{phonenumber}5802TH54{amount_length}{amount}530376481{hex_length}{hex_message}";function generate(e="",t=0,n=""){if(String(n).length>24)return"จำนวนตัวอักษรของข้อความห้ามมากกว่า 24 ตัวอักษร";const r=String(t).padStart(10,"0"),a=[...String(n)],g=a.map((e=>e.charCodeAt(0).toString(16).padStart(4,"0"))).join(""),h=String(4*a.length).padStart(2,"0");return TrueQR_SET.replace("{phonenumber}",e).replace("{amount_length}",String(r.length).padStart(2,"0")).replace("{amount}",r).replace("{hex_message}",g).replace("{hex_length}",h).toUpperCase()}`

const select_premium = [
  {
    id: 1,
    name: "1 Day",
    discription: "5 Baht",
    time: 86400,
    price: 5,
  },
  {
    id: 2,
    name: "7 Days",
    discription: "30 Baht",
    time: 604800,
    price: 30,
  },
  {
    id: 3,
    name: "30 Days",
    discription: "100 Baht",
    time: 2592000,
    price: 100,
  },
]

const reset_css = `
/* http://meyerweb.com/eric/tools/css/reset/ 
   v2.0 | 20110126
   License: none (public domain)
*/

html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed, 
figure, figcaption, footer, header, hgroup, 
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure, 
footer, header, hgroup, menu, nav, section {
	display: block;
}
body {
	line-height: 1;
}
ol, ul {
	list-style: none;
}
blockquote, q {
	quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
	content: '';
	content: none;
}
table {
	border-collapse: collapse;
	border-spacing: 0;
}
`;

const home = `
<!DOCTYPE html>
<html>
<head>
    <title>Premium System</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="/reset.css"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css">
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
            <h1 class="text-3xl font-bold mb-4">Buy Premium on Amonsus Server</h1>
            <p class="text-lg mb-4">Enter your user ID to upgrade to premium:</p>
            <form id="premiumForm">
                <input class="w-full p-3 mb-4 border border-gray-300 rounded" type="text" name="id" placeholder="User ID" required/>
                <select class="w-full p-3 mb-4 border border-gray-300 rounded" name="premium" required>
                    <option value="">Select Premium</option>
                    ${select_premium.map((item) => `<option value="${item.id}">${item.name} (${item.discription})</option>`).join("")}
                </select>
                <button class="w-full p-3 bg-blue-500 text-white rounded" type="submit">Generate QR Code</button>
        </form>
        <div id="qr" class="mt-4"></div>
    </div>
</div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js"></script>
    <script>
        // sorce gen image https://qr-code.oiioioiiioooioio.download/qr-img/ + data 
        ${lib_create_tw_mini}

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");

        // regex for check number
        if (/^\\d+$/.test(id)) {
            document.querySelector("input[name=id]").value = id;
            document.querySelector("button[type=submit]").click();
            // disable input
            document.querySelector("input[name=id]").disabled = true;
            // style input disable
            document.querySelector("input[name=id]").classList.add("bg-gray-200");
            // add id to fill
            document.querySelector("input[name=id]").setAttribute("data-id", id);
        }
        
        document.getElementById("premiumForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            const premium = data.get("premium");

            // get id from input or paramiter
            const id = document.querySelector("input[name=id]").getAttribute("data-id") || data.get("id");

            if (!id || !premium) {
                return iziToast.error({ message: "Please fill all fields" });
            }

            // regex for check number
            const regex = /^(0|[1-9][0-9]*)$/;
            if (!regex.test(id) || !regex.test(premium)) {
                return iziToast.error({ message: "Invalid input" });
            }

            const premiumData = ${JSON.stringify(select_premium)};
            const selectedPremium = premiumData.find((item) => item.id == premium);

            if (!selectedPremium) {
                return iziToast.error({ message: "Invalid premium" });
            }

            const qrData = generate("${setphone_num}", selectedPremium.price, id);
            document.getElementById("qr").innerHTML = \`
                <img src="https://qr-code.oiioioiiioooioio.download/qr-img/\${qrData}" alt="QR Code" />
            \`;
            return iziToast.success({ message: "QR Code generated" });
        });

        

    </script>
</body>
</html>

`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(home, {
        headers: { "content-type": "text/html" },
      });
    }

    if (url.pathname === "/reset.css") { 
      return new Response(reset_css, {
        headers: { "content-type": "text/css" },
      });
    }

    if (url.pathname === "/croncron") {
      return new Response("OK", {
        headers: { "content-type": "text/plain" },
      });
    }

    if (url.pathname === "/helloworld") {
      return new Response("Hello World", {
        headers: { "content-type": "text/plain" },
      });
    }

    if (url.pathname === "/check_jwt_only") {
      request.headers.get("content-type") === "application/json";
      const requestBody = await request.json();

      // json message jwt
      const jwt = requestBody.message;
      const secret = jwt_secret;

      try {
        const jwt_data = await decodeJwt(jwt, secret);
        console.log(jwt_data);
        
        /*
        {
          header: { alg: 'HS256', typ: 'JWT' },
          payload: { server: 'handshake', iat: 1713529557 },
          verified: false
        }
        */
        
        return new Response(`true`);

      } catch (error) {
        return new Response(`true`);
      }

    }

    const path = url.pathname.replace("/", "");
    if (!/^\d+$/.test(path)) {
      return new Response("Invalid path", {
        status: 400,
        headers: { "content-type": "text/plain" },
      });
    }
    
    return new Response(`
    user id ${path}
    
    `, {
      headers: { "content-type": "text/plain" },
    });
  },
};
