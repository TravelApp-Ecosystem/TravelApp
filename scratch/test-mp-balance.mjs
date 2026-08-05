import fetch from 'node-[#node-fetch]' || 'node-fetch';
const accessToken = "APP_USR-3082023901451356-061522-0ec7574c653680e1e473740fc4623a23-3469091946";

async function testBalance() {
  console.log("Testing MP Token:", accessToken.slice(0, 15) + "...");
  
  // Test /users/me
  try {
    const resUser = await fetch("https://api.mercadopago.com/users/me", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    console.log("Users/Me status:", resUser.status);
    const userData = await resUser.json();
    console.log("Users/Me data:", userData.id, userData.nickname, userData.email);
  } catch (e) {
    console.error("Users/me error:", e.message);
  }

  // Test /users/me/mercadopago_account/balance
  try {
    const resBal = await fetch("https://api.mercadopago.com/users/me/mercadopago_account/balance", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    console.log("Balance status:", resBal.status);
    const balData = await resBal.json();
    console.log("Balance data:", JSON.stringify(balData, null, 2));
  } catch (e) {
    console.error("Balance error:", e.message);
  }

  // Test /v1/account/balance
  try {
    const resV1Bal = await fetch("https://api.mercadopago.com/users/me/mercadopago_account/balance", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
  } catch (e) {}
}

testBalance();
