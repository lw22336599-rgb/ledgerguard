export const developerShadowJs = `
const shadowButton=document.querySelector("#developer-shadow");
shadowButton.addEventListener("click",async()=>{
  show("neutral","Running shadow check","Evaluating the request without authorizing, signing, or submitting a transaction.");
  const recipient="0x2222222222222222222222222222222222222222";
  const usdc="0x3600000000000000000000000000000000000000";
  const data="0xa9059cbb"+recipient.slice(2).padStart(64,"0")+"00000000000000000000000000000000000000000000000000000000000f4240";
  try{
    const body=await request("/v1/developer/shadow",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        network:"arcTestnet",
        to:usdc,
        data,
        valueWei:"0",
        intent:{
          action:"transfer",
          expectedRecipient:recipient,
          expectedAssetAddress:usdc,
          expectedAmountMicroUsdc:"1000000",
          purpose:"Developer console shadow test"
        },
        policy:{
          allowUnlimitedApproval:false,
          requireSimulation:false,
          maxAmountMicroUsdc:"1000000"
        }
      })
    });
    show("review","Shadow result: "+body.wouldDecision,"This result was metered but never enforced and never signed.",body);
  }catch(error){
    show("error","Shadow request failed",error.message,error.body);
  }
});`;
