import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fbAdAccountId, fbAdAccessToken, datePreset = "last_7d" } = await req.json();

    if (!fbAdAccountId || !fbAdAccessToken) {
      return NextResponse.json({ error: "Missing Ad Account ID or Access Token" }, { status: 400 });
    }

    // Format the Ad Account ID properly if it doesn't have 'act_' prefix
    const accountId = fbAdAccountId.startsWith('act_') ? fbAdAccountId : `act_${fbAdAccountId}`;

    // 1. Fetch Campaign Level Performance Metrics
    const fields = [
      "campaign_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "inline_link_clicks",
      "cpc",
      "ctr",
      "cpm",
      "actions",
      "action_values"
    ].join(",");

    const performanceUrl = `https://graph.facebook.com/v20.0/${accountId}/insights?fields=${fields}&level=campaign&date_preset=${datePreset}&access_token=${fbAdAccessToken}`;
    const perfRes = await fetch(performanceUrl);
    const perfData = await perfRes.json();

    if (perfData.error) {
      return NextResponse.json({ error: perfData.error.message }, { status: 400 });
    }

    // 2. Fetch Demographic Data (Age and Gender) at Account Level
    const demoFields = ["spend", "impressions", "actions"].join(",");
    const demoUrl = `https://graph.facebook.com/v20.0/${accountId}/insights?fields=${demoFields}&level=account&breakdowns=age,gender&date_preset=${datePreset}&access_token=${fbAdAccessToken}`;
    const demoRes = await fetch(demoUrl);
    const demoData = await demoRes.json();

    // Process Performance Data
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalLinkClicks = 0;
    let totalPurchases = 0;
    let totalPurchaseValue = 0;

    const campaigns = (perfData.data || []).map((camp: any) => {
      const spend = parseFloat(camp.spend || "0");
      const impressions = parseInt(camp.impressions || "0");
      const reach = parseInt(camp.reach || "0");
      const linkClicks = parseInt(camp.inline_link_clicks || camp.clicks || "0");
      
      totalSpend += spend;
      totalImpressions += impressions;
      totalLinkClicks += linkClicks;

      // Parse Actions
      let pageViews = 0;
      let addToCart = 0;
      let initiateCheckout = 0;
      let purchases = 0;
      let purchaseValue = 0;

      if (camp.actions) {
        camp.actions.forEach((action: any) => {
          if (action.action_type === "view_content" || action.action_type === "landing_page_view") pageViews += parseInt(action.value);
          if (action.action_type === "add_to_cart") addToCart += parseInt(action.value);
          if (action.action_type === "initiate_checkout") initiateCheckout += parseInt(action.value);
          if (action.action_type === "purchase") purchases += parseInt(action.value);
        });
      }

      if (camp.action_values) {
        camp.action_values.forEach((val: any) => {
          if (val.action_type === "purchase") purchaseValue += parseFloat(val.value);
        });
      }

      totalPurchases += purchases;
      totalPurchaseValue += purchaseValue;

      return {
        id: camp.campaign_id,
        name: camp.campaign_name,
        spend,
        impressions,
        reach,
        linkClicks,
        cpc: parseFloat(camp.cpc || "0"),
        ctr: parseFloat(camp.ctr || "0"),
        cpm: parseFloat(camp.cpm || "0"),
        pageViews,
        addToCart,
        initiateCheckout,
        purchases,
        purchaseValue,
        roas: spend > 0 ? (purchaseValue / spend) : 0,
        cpp: purchases > 0 ? (spend / purchases) : 0
      };
    });

    // Process Demographic Data
    const ageData: Record<string, number> = {};
    let maleSpend = 0;
    let femaleSpend = 0;

    (demoData.data || []).forEach((row: any) => {
      const spend = parseFloat(row.spend || "0");
      const age = row.age;
      const gender = row.gender; // "male", "female", "unknown"

      if (age) {
        ageData[age] = (ageData[age] || 0) + spend;
      }
      if (gender === "male") maleSpend += spend;
      if (gender === "female") femaleSpend += spend;
    });

    const demographics = {
      gender: [
        { name: "Male", value: maleSpend },
        { name: "Female", value: femaleSpend }
      ],
      age: Object.entries(ageData).map(([age, spend]) => ({ age, spend })).sort((a, b) => a.age.localeCompare(b.age))
    };

    const overview = {
      totalSpend,
      totalImpressions,
      totalLinkClicks,
      totalPurchases,
      totalPurchaseValue,
      overallRoas: totalSpend > 0 ? (totalPurchaseValue / totalSpend) : 0,
      overallCpp: totalPurchases > 0 ? (totalSpend / totalPurchases) : 0
    };

    return NextResponse.json({
      overview,
      campaigns,
      demographics
    });

  } catch (error) {
    console.error("FB Ads API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
