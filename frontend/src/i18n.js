import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'expense-tracker.language';
const listeners = new Set();
let language = readLanguage();
let depth = 0;
applyLanguage(language);

const PHRASES = {
  'Expense Tracker': 'အသုံးစရိတ် မှတ်တမ်း',
  'Skip to main content': 'ပင်မအကြောင်းအရာသို့ ကျော်ရန်',
  Dashboard: 'ပင်မစာမျက်နှာ',
  Transactions: 'ငွေစာရင်း',
  Expenses: 'အသုံးစရိတ်',
  Income: 'ဝင်ငွေ',
  Categories: 'အမျိုးအစား',
  Budgets: 'ဘတ်ဂျက်',
  Recurring: 'ထပ်တလဲလဲ',
  Reports: 'အစီရင်ခံစာ',
  Insights: 'သုံးသပ်ချက်',
  Notifications: 'အသိပေးချက်',
  Settings: 'ဆက်တင်',
  Profile: 'ပရိုဖိုင်',
  'Log out': 'ထွက်ရန်',
  Menu: 'မီနူး',
  Home: 'ပင်မ',
  Language: 'ဘာသာစကား',
  English: 'English',
  Myanmar: 'မြန်မာ',
  'Open menu': 'မီနူး ဖွင့်ရန်',
  'Close menu': 'မီနူး ပိတ်ရန်',
  'Close dialog': 'ဒိုင်ယာလော့ ပိတ်ရန်',
  Account: 'အကောင့်',
  Main: 'ပင်မ',
  Primary: 'အဓိက',
  Actions: 'လုပ်ဆောင်ချက်',
  'Welcome back': 'ပြန်လာတာ ကြိုဆိုပါတယ်',
  'Sign in to track your money and review your spending.': 'ငွေကို မှတ်တမ်းတင်ပြီး အသုံးစရိတ်ကို ပြန်ကြည့်ရန် ဝင်ပါ။',
  'New here?': 'အကောင့် မရှိသေးဘူးလား။',
  'Create an account': 'အကောင့် ဖွင့်ရန်',
  'Sign in': 'ဝင်ရန်',
  'Create your account': 'အကောင့် ဖွင့်ပါ',
  'Start with a secure login. Your expenses stay private to you.': 'လုံခြုံသော အကောင့်ဖြင့် စတင်ပါ။ သင့်အသုံးစရိတ်ကို သင်တစ်ဦးတည်းသာ မြင်ရသည်။',
  'Already have an account?': 'အကောင့် ရှိပြီးသားလား။',
  'Create account': 'အကောင့် ဖွင့်ရန်',
  'Checking your session': 'အကောင့်ကို စစ်နေသည်',
  Loading: 'ဖွင့်နေသည်',
  Name: 'အမည်',
  Email: 'အီးမေးလ်',
  Password: 'စကားဝှက်',
  'At least 8 characters.': 'အနည်းဆုံး အက္ခရာ ၈ လုံး။',
  Amount: 'ပမာဏ',
  Description: 'ဖော်ပြချက်',
  Category: 'အမျိုးအစား',
  Date: 'ရက်စွဲ',
  'Payment method': 'ငွေပေးချေမှု',
  Payment: 'ငွေပေးချေမှု',
  Notes: 'မှတ်ချက်',
  Source: 'ရင်းမြစ်',
  Search: 'ရှာရန်',
  From: 'မှ',
  To: 'ထိ',
  Sort: 'စီရန်',
  'Start date': 'စတင်ရက်',
  'End date': 'ပြီးဆုံးရက်',
  Period: 'ကာလ',
  Month: 'လ',
  Year: 'နှစ်',
  Frequency: 'ကြိမ်နှုန်း',
  'Next date': 'နောက်ရက်',
  Icon: 'သင်္ကေတ',
  Color: 'အရောင်',
  Custom: 'စိတ်ကြိုက်',
  'Custom color': 'စိတ်ကြိုက် အရောင်',
  'Description or notes': 'ဖော်ပြချက် သို့မဟုတ် မှတ်ချက်',
  'Source or description': 'ရင်းမြစ် သို့မဟုတ် ဖော်ပြချက်',
  'All categories': 'အမျိုးအစား အားလုံး',
  'All methods': 'နည်းလမ်း အားလုံး',
  'Select a category': 'အမျိုးအစား ရွေးပါ',
  'Overall monthly budget': 'လစဉ် စုစုပေါင်း ဘတ်ဂျက်',
  Overall: 'စုစုပေါင်း',
  'Newest first': 'အသစ်ဆုံး အရင်',
  'Oldest first': 'အဟောင်းဆုံး အရင်',
  'Highest amount': 'ပမာဏ အများဆုံး',
  'Lowest amount': 'ပမာဏ အနည်းဆုံး',
  'This month': 'ဤလ',
  'Last month': 'ယခင်လ',
  'This year': 'ဤနှစ်',
  'Custom range': 'ကိုယ်တိုင် သတ်မှတ်',
  'Add expense': 'အသုံးစရိတ် ထည့်ရန်',
  'Edit expense': 'အသုံးစရိတ် ပြင်ရန်',
  'Add income': 'ဝင်ငွေ ထည့်ရန်',
  'Edit income': 'ဝင်ငွေ ပြင်ရန်',
  'Add category': 'အမျိုးအစား ထည့်ရန်',
  'Edit category': 'အမျိုးအစား ပြင်ရန်',
  'Add budget': 'ဘတ်ဂျက် ထည့်ရန်',
  'Edit budget': 'ဘတ်ဂျက် ပြင်ရန်',
  'Add recurring expense': 'ထပ်တလဲလဲ အသုံးစရိတ် ထည့်ရန်',
  'Edit recurring expense': 'ထပ်တလဲလဲ အသုံးစရိတ် ပြင်ရန်',
  'Save changes': 'ပြင်ဆင်ချက် သိမ်းရန်',
  'Save settings': 'ဆက်တင် သိမ်းရန်',
  Cancel: 'မလုပ်တော့ပါ',
  Delete: 'ဖျက်ရန်',
  Edit: 'ပြင်ရန်',
  Previous: 'ယခင်',
  Next: 'နောက်',
  Pause: 'ခဏရပ်',
  Resume: 'ပြန်ဖွင့်',
  Active: 'ဖွင့်ထား',
  Paused: 'ရပ်ထား',
  Weekly: 'အပတ်စဉ်',
  Monthly: 'လစဉ်',
  Yearly: 'နှစ်စဉ်',
  'Export CSV': 'CSV ထုတ်ရန်',
  'Try again': 'ထပ်ကြိုးစားပါ',
  'Mark as read': 'ဖတ်ပြီးဟု မှတ်ရန်',
  'Mark all as read': 'အားလုံး ဖတ်ပြီးဟု မှတ်ရန်',
  'View budgets': 'ဘတ်ဂျက် ကြည့်ရန်',
  'View report': 'အစီရင်ခံစာ ကြည့်ရန်',
  'View recurring': 'ထပ်တလဲလဲ ကြည့်ရန်',
  'View insights': 'သုံးသပ်ချက် ကြည့်ရန်',
  'Edit in settings': 'ဆက်တင်တွင် ပြင်ရန်',
  Today: 'ယနေ့',
  Yesterday: 'မနေ့',
  Cash: 'ငွေသား',
  Card: 'ကတ်',
  'Bank transfer': 'ဘဏ်ငွေလွှဲ',
  'Mobile wallet': 'မိုဘိုင်းပိုက်ဆံအိတ်',
  Other: 'အခြား',
  Food: 'အစားအသောက်',
  Transport: 'သယ်ယူပို့ဆောင်ရေး',
  Housing: 'အိမ်ရာ',
  Utilities: 'အသုံးအဆောင်',
  Shopping: 'စျေးဝယ်ခြင်း',
  Entertainment: 'ဖျော်ဖြေရေး',
  Health: 'ကျန်းမာရေး',
  Education: 'ပညာရေး',
  Personal: 'ကိုယ်ရေးကိုယ်တာ',
  Uncategorized: 'အမျိုးအစားမဲ့',
  'On track': 'လမ်းကြောင်းမှန်',
  Warning: 'သတိပေး',
  'Near limit': 'ကန့်သတ်ချက်နားကပ်',
  'Over budget': 'ဘတ်ဂျက်ကျော်',
  Light: 'အလင်း',
  Dark: 'အမှောင်',
  Theme: 'အပြင်အဆင်',
  'Date format': 'ရက်စွဲပုံစံ',
  Currency: 'ငွေကြေး',
  'MMK — Myanmar kyat': 'MMK — မြန်မာကျပ်',
  'USD — US dollar': 'USD — အမေရိကန်ဒေါ်လာ',
  'EUR — Euro': 'EUR — ယူရို',
  'GBP — British pound': 'GBP — ဗြိတိသျှပေါင်',
  'SGD — Singapore dollar': 'SGD — စင်ကာပူဒေါ်လာ',
  'THB — Thai baht': 'THB — ထိုင်းဘတ်',
  'JPY — Japanese yen': 'JPY — ဂျပန်ယန်း',
  'CNY — Chinese yuan': 'CNY — တရုတ်ယွမ်',
  'INR — Indian rupee': 'INR — အိန္ဒိယရူပီး',
  'AUD — Australian dollar': 'AUD — ဩစတြေးလျဒေါ်လာ',
  'Budget alerts': 'ဘတ်ဂျက် သတိပေးချက်',
  'Warnings when a budget is close to its limit or over it.': 'ဘတ်ဂျက် ကန့်သတ်ချက်နားရောက်သောအခါ သို့မဟုတ် ကျော်သောအခါ သတိပေးသည်။',
  'Recurring reminders': 'ထပ်တလဲလဲ သတိပေးချက်',
  'Reminders a few days before a recurring expense is due.': 'ထပ်တလဲလဲ အသုံးစရိတ် မရောက်မီ ရက်အနည်းငယ်အလိုတွင် သတိပေးသည်။',
  'Monthly reports': 'လစဉ် အစီရင်ခံစာ',
  'A summary when this month has income or expenses.': 'ဤလတွင် ဝင်ငွေ သို့မဟုတ် အသုံးစရိတ် ရှိလျှင် အကျဉ်းချုပ် ပြသည်။',
  'Record and review money going out.': 'ထွက်သွားသော ငွေကို မှတ်တမ်းတင်ပြီး ပြန်ကြည့်ပါ။',
  'Record money coming in.': 'ဝင်လာသော ငွေကို မှတ်တမ်းတင်ပါ။',
  'Group spending so reports stay easy to read.': 'အစီရင်ခံစာ ဖတ်ရလွယ်အောင် အသုံးစရိတ်ကို အုပ်စုဖွဲ့ပါ။',
  'Set a monthly limit and see how much is left.': 'လစဉ် ကန့်သတ်ချက် သတ်မှတ်ပြီး ကျန်ငွေကို ကြည့်ပါ။',
  'Recurring expenses': 'ထပ်တလဲလဲ အသုံးစရိတ်',
  'Bills and other costs that repeat. When one is due, it is added to your expenses.': 'ထပ်ခါထပ်ခါ ကျသည့် ဘေလ်နှင့် ကုန်ကျစရိတ်များ။ ရက်ကျလျှင် အသုံးစရိတ်ထဲ ထည့်သည်။',
  'Compare income, expenses, and categories over time.': 'ဝင်ငွေ၊ အသုံးစရိတ်နှင့် အမျိုးအစားကို ကာလအလိုက် နှိုင်းယှဉ်ပါ။',
  'Plain-language notes about your records. These describe what happened and are not financial advice.': 'သင့်မှတ်တမ်းအကြောင်း ရိုးရိုးစာသား မှတ်ချက်များဖြစ်သည်။ ဖြစ်ခဲ့သည်ကို ဖော်ပြခြင်းသာဖြစ်ပြီး ငွေကြေးအကြံဉာဏ် မဟုတ်ပါ။',
  'Budget warnings, recurring reminders, and monthly reports.': 'ဘတ်ဂျက် သတိပေးချက်၊ ထပ်တလဲလဲ သတိပေးချက်နှင့် လစဉ် အစီရင်ခံစာ။',
  'The name, email, and currency saved with this account.': 'ဤအကောင့်တွင် သိမ်းထားသော အမည်၊ အီးမေးလ်နှင့် ငွေကြေး။',
  'Account details are saved with your profile. Language, theme, and date format stay on this device.': 'အကောင့်အချက်အလက်ကို ပရိုဖိုင်တွင် သိမ်းသည်။ ဘာသာစကား၊ အပြင်အဆင်နှင့် ရက်စွဲပုံစံကို ဤစက်တွင် သိမ်းသည်။',
  'Email stays with your login.': 'အီးမေးလ်သည် အကောင့်ဝင်ရန်အတွက် ဖြစ်ပြီး မပြောင်းပါ။',
  'Saved on this device.': 'ဤစက်တွင် သိမ်းထားသည်။',
  Appearance: 'အသွင်အပြင်',
  'This month.': 'ဤလ။',
  'Here\'s your financial overview.': 'သင့်ငွေကြေး အကျဉ်းချုပ် ဖြစ်သည်။',
  'Budget progress': 'ဘတ်ဂျက် အခြေအနေ',
  'No budgets this month.': 'ဤလအတွက် ဘတ်ဂျက် မရှိသေးပါ။',
  'Nothing to summarize yet': 'အကျဉ်းချုပ် ပြရန် မလုံလောက်သေးပါ',
  'Your balance, spending, and recent activity will show up here after you record income or expenses.': 'ဝင်ငွေ သို့မဟုတ် အသုံးစရိတ် မှတ်ပြီးနောက် လက်ကျန်၊ အသုံးစရိတ်နှင့် လတ်တလော လှုပ်ရှားမှုကို ဤနေရာတွင် ပြသည်။',
  'Unable to load your financial overview': 'ငွေကြေး အကျဉ်းချုပ်ကို ဖွင့်၍ မရပါ',
  'Check your connection and try again.': 'ချိတ်ဆက်မှုကို စစ်ပြီး ထပ်ကြိုးစားပါ။',
  'Recent transactions': 'လတ်တလော ငွေစာရင်း',
  'Total balance': 'စုစုပေါင်း လက်ကျန်',
  'Income minus expenses': 'ဝင်ငွေမှ အသုံးစရိတ် နုတ်ထားသည်',
  'Total income': 'စုစုပေါင်း ဝင်ငွေ',
  'Total expenses': 'စုစုပေါင်း အသုံးစရိတ်',
  'All time': 'အစအဆုံး',
  'Monthly spending': 'လစဉ် အသုံးစရိတ်',
  'Average daily spending': 'တစ်ရက်ပျမ်းမျှ အသုံးစရိတ်',
  'Top category': 'အသုံးအများဆုံး အမျိုးအစား',
  'None yet': 'မရှိသေးပါ',
  'No spending this month': 'ဤလတွင် အသုံးစရိတ် မရှိပါ',
  'No spending this month.': 'ဤလတွင် အသုံးစရိတ် မရှိပါ။',
  'No spending in this period': 'ဤကာလတွင် အသုံးစရိတ် မရှိပါ',
  'No spending in this period.': 'ဤကာလတွင် အသုံးစရိတ် မရှိပါ။',
  'No income or expenses in this period.': 'ဤကာလတွင် ဝင်ငွေ သို့မဟုတ် အသုံးစရိတ် မရှိပါ။',
  'No spending in the last 6 months.': 'လွန်ခဲ့သော ၆ လတွင် အသုံးစရိတ် မရှိပါ။',
  'No income or expenses in the last 6 months.': 'လွန်ခဲ့သော ၆ လတွင် ဝင်ငွေ သို့မဟုတ် အသုံးစရိတ် မရှိပါ။',
  'Across this period': 'ဤကာလ တစ်လျှောက်',
  Balance: 'လက်ကျန်',
  'Matching income': 'ကိုက်ညီသော ဝင်ငွေ',
  'Unable to load expenses': 'အသုံးစရိတ်ကို ဖွင့်၍ မရပါ',
  'No expenses yet': 'အသုံးစရိတ် မရှိသေးပါ',
  'Start tracking your spending by adding your first expense.': 'ပထမဆုံး အသုံးစရိတ် ထည့်ပြီး စတင် မှတ်တမ်းတင်ပါ။',
  'No matching expenses': 'ကိုက်ညီသော အသုံးစရိတ် မရှိပါ',
  'Try a different search, category, date, or payment method.': 'ရှာဖွေမှု၊ အမျိုးအစား၊ ရက်စွဲ သို့မဟုတ် ငွေပေးချေမှုကို ပြောင်းကြည့်ပါ။',
  'Delete this expense?': 'ဤအသုံးစရိတ်ကို ဖျက်မလား။',
  'This action cannot be undone.': 'ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ။',
  'Unable to load income': 'ဝင်ငွေကို ဖွင့်၍ မရပါ',
  'No income yet': 'ဝင်ငွေ မရှိသေးပါ',
  'Record money coming in by adding your first income.': 'ပထမဆုံး ဝင်ငွေ ထည့်ပြီး မှတ်တမ်းတင်ပါ။',
  'No matching income': 'ကိုက်ညီသော ဝင်ငွေ မရှိပါ',
  'Try a different search or date range.': 'ရှာဖွေမှု သို့မဟုတ် ရက်စွဲအပိုင်းအခြားကို ပြောင်းကြည့်ပါ။',
  'Delete this income?': 'ဤဝင်ငွေကို ဖျက်မလား။',
  'Unable to load categories': 'အမျိုးအစားကို ဖွင့်၍ မရပါ',
  'No categories yet': 'အမျိုးအစား မရှိသေးပါ',
  'Add a category to group your spending.': 'အသုံးစရိတ် အုပ်စုဖွဲ့ရန် အမျိုးအစား ထည့်ပါ။',
  'Delete this category?': 'ဤအမျိုးအစားကို ဖျက်မလား။',
  'Existing expenses will stay in your history without this category.': 'ရှိပြီးသား အသုံးစရိတ်သည် မှတ်တမ်းတွင် ကျန်နေပြီး ဤအမျိုးအစား မရှိတော့ပါ။',
  'Expenses whose category was deleted.': 'အမျိုးအစား ဖျက်ပြီးသော အသုံးစရိတ်များ။',
  'Unable to load budgets': 'ဘတ်ဂျက်ကို ဖွင့်၍ မရပါ',
  'No budgets for this month': 'ဤလအတွက် ဘတ်ဂျက် မရှိပါ',
  'Set a limit to track how much you have left to spend.': 'ကျန်ငွေကို သိရန် ကန့်သတ်ချက် သတ်မှတ်ပါ။',
  'Delete this budget?': 'ဤဘတ်ဂျက်ကို ဖျက်မလား။',
  'Your expenses will stay. This only removes the spending limit.': 'အသုံးစရိတ်များ ကျန်နေသည်။ သုံးစွဲမှု ကန့်သတ်ချက်ကိုသာ ဖယ်သည်။',
  'Unable to load recurring expenses': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ဖွင့်၍ မရပါ',
  'No recurring expenses yet': 'ထပ်တလဲလဲ အသုံးစရိတ် မရှိသေးပါ',
  'Add rent, bills, or anything else that repeats.': 'အိမ်ငှားခ၊ ဘေလ် သို့မဟုတ် ထပ်တလဲလဲ ကုန်ကျစရိတ် ထည့်ပါ။',
  'Delete this recurring expense?': 'ဤထပ်တလဲလဲ အသုံးစရိတ်ကို ဖျက်မလား။',
  'Expenses already added will stay. This only removes the schedule.': 'ထည့်ပြီးသား အသုံးစရိတ်များ ကျန်နေသည်။ အချိန်ဇယားကိုသာ ဖယ်သည်။',
  'Choose a date range': 'ရက်စွဲအပိုင်းအခြား ရွေးပါ',
  'Pick a start and end date to see income, expenses, and categories.': 'ဝင်ငွေ၊ အသုံးစရိတ်နှင့် အမျိုးအစားကို ကြည့်ရန် စတင်ရက်နှင့် ပြီးဆုံးရက် ရွေးပါ။',
  'Unable to load this report': 'ဤအစီရင်ခံစာကို ဖွင့်၍ မရပါ',
  'Not enough data yet': 'ဒေတာ မလုံလောက်သေးပါ',
  'Add a few transactions to see your spending trends.': 'အသုံးစရိတ် လမ်းကြောင်းကို ကြည့်ရန် ငွေစာရင်း အနည်းငယ် ထည့်ပါ။',
  'End date must be on or after the start date': 'ပြီးဆုံးရက်သည် စတင်ရက်နှင့် တစ်ရက်တည်း သို့မဟုတ် နောက်ကျရမည်',
  'Each day in this period.': 'ဤကာလ၏ နေ့စဉ်။',
  'Each month in this period.': 'ဤကာလ၏ လစဉ်။',
  'Monthly expense trend': 'လစဉ် အသုံးစရိတ် လမ်းကြောင်း',
  'Category breakdown': 'အမျိုးအစားအလိုက်',
  'Where the spending went.': 'ငွေ ဘယ်ကို ရောက်သွားသလဲ။',
  'Income vs expenses': 'ဝင်ငွေနှင့် အသုံးစရိတ်',
  'Spending overview': 'အသုံးစရိတ် အကျဉ်းချုပ်',
  'Expenses over the last 6 months.': 'လွန်ခဲ့သော ၆ လ အသုံးစရိတ်။',
  'Spending by category': 'အမျိုးအစားအလိုက် အသုံးစရိတ်',
  'The last 6 months.': 'လွန်ခဲ့သော ၆ လ။',
  'Expenses over the last 6 months': 'လွန်ခဲ့သော ၆ လ အသုံးစရိတ်',
  'Spending by category this month': 'ဤလ အမျိုးအစားအလိုက် အသုံးစရိတ်',
  'Income and expenses over the last 6 months': 'လွန်ခဲ့သော ၆ လ ဝင်ငွေနှင့် အသုံးစရိတ်',
  'Expenses in this period': 'ဤကာလ အသုံးစရိတ်',
  'Income and expenses in this period': 'ဤကာလ ဝင်ငွေနှင့် အသုံးစရိတ်',
  'Unable to load your insights': 'သုံးသပ်ချက်ကို ဖွင့်၍ မရပါ',
  'No insights yet': 'သုံးသပ်ချက် မရှိသေးပါ',
  'Add a few transactions to see notes about your spending.': 'အသုံးစရိတ် မှတ်ချက်ကို ကြည့်ရန် ငွေစာရင်း အနည်းငယ် ထည့်ပါ။',
  'Unable to load your notifications': 'အသိပေးချက်ကို ဖွင့်၍ မရပါ',
  'No notifications yet': 'အသိပေးချက် မရှိသေးပါ',
  'Budget warnings and reminders will appear here.': 'ဘတ်ဂျက် သတိပေးချက်နှင့် သတိပေးချက်များ ဤနေရာတွင် ပေါ်လာမည်။',
  'Delete this notification?': 'ဤအသိပေးချက်ကို ဖျက်မလား။',
  'This only removes the notice. Your budgets and expenses stay.': 'အသိပေးချက်ကိုသာ ဖယ်သည်။ ဘတ်ဂျက်နှင့် အသုံးစရိတ်များ ကျန်နေသည်။',
  Unread: 'မဖတ်ရသေး',
  'Higher than usual': 'ပုံမှန်ထက် များနေသည်',
  'Largest category': 'အကြီးဆုံး အမျိုးအစား',
  'Second-largest category': 'ဒုတိယ အကြီးဆုံး အမျိုးအစား',
  'Daily spending': 'နေ့စဉ် အသုံးစရိတ်',
  'Budget usage': 'ဘတ်ဂျက် သုံးစွဲမှု',
  'Spending increased': 'အသုံးစရိတ် တိုးသွားသည်',
  'Spending decreased': 'အသုံးစရိတ် လျော့သွားသည်',
  'Healthy balance': 'လက်ကျန် ကောင်းသည်',
  'Expenses are higher': 'အသုံးစရိတ် ပိုများသည်',
  'Even balance': 'ဝင်ငွေနှင့် အသုံးစရိတ် ညီသည်',
  'Budget warning': 'ဘတ်ဂျက် သတိပေးချက်',
  'Budget exceeded': 'ဘတ်ဂျက် ကျော်သွားသည်',
  'Recurring expense': 'ထပ်တလဲလဲ အသုံးစရိတ်',
  'Monthly report': 'လစဉ် အစီရင်ခံစာ',
  'Your income is currently higher than your expenses this month.': 'ဤလတွင် ဝင်ငွေသည် အသုံးစရိတ်ထက် များနေသည်။',
  'Your expenses are currently higher than your income this month.': 'ဤလတွင် အသုံးစရိတ်သည် ဝင်ငွေထက် များနေသည်။',
  'Your income and expenses are equal this month.': 'ဤလတွင် ဝင်ငွေနှင့် အသုံးစရိတ် ညီနေသည်။',
  'Name is required': 'အမည် လိုအပ်သည်',
  'Email is required': 'အီးမေးလ် လိုအပ်သည်',
  'Password is required': 'စကားဝှက် လိုအပ်သည်',
  'Password must be at least 8 characters': 'စကားဝှက်သည် အနည်းဆုံး အက္ခရာ ၈ လုံး ရှိရမည်',
  'Amount must be greater than 0': 'ပမာဏသည် ၀ ထက် ကြီးရမည်',
  'Category is required': 'အမျိုးအစား လိုအပ်သည်',
  'Date is required': 'ရက်စွဲ လိုအပ်သည်',
  'Description is required': 'ဖော်ပြချက် လိုအပ်သည်',
  'Source is required': 'ရင်းမြစ် လိုအပ်သည်',
  'Category name is required': 'အမျိုးအစားအမည် လိုအပ်သည်',
  'Year is not valid': 'နှစ် မမှန်ပါ',
  'Email or password is incorrect.': 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေသည်။',
  'An account with this email already exists.': 'ဤအီးမေးလ်ဖြင့် အကောင့် ရှိပြီးသားဖြစ်သည်။',
  'Currency is not supported': 'ဤငွေကြေးကို မပံ့ပိုးပါ',
  'Currency must be a 3-letter code': 'ငွေကြေးသည် အက္ခရာ ၃ လုံး ဖြစ်ရမည်',
  'Validation failed': 'စစ်ဆေးမှု မအောင်မြင်ပါ',
  'Something went wrong. Please try again.': 'တစ်ခုခု မှားသွားသည်။ ထပ်ကြိုးစားပါ။',
  'Unable to save expense. Please try again.': 'အသုံးစရိတ်ကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Unable to save income. Please try again.': 'ဝင်ငွေကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Unable to save category. Please try again.': 'အမျိုးအစားကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Unable to save budget. Please try again.': 'ဘတ်ဂျက်ကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Unable to save recurring expense. Please try again.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Unable to save settings. Please try again.': 'ဆက်တင်ကို သိမ်း၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Expense updated successfully.': 'အသုံးစရိတ်ကို ပြင်ပြီးပါပြီ။',
  'Expense added successfully.': 'အသုံးစရိတ် ထည့်ပြီးပါပြီ။',
  'Expense deleted successfully.': 'အသုံးစရိတ် ဖျက်ပြီးပါပြီ။',
  'Unable to delete expense. Please try again.': 'အသုံးစရိတ်ကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Expenses exported.': 'အသုံးစရိတ်ကို ထုတ်ပြီးပါပြီ။',
  'Unable to export expenses. Please try again.': 'အသုံးစရိတ်ကို ထုတ်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Income updated successfully.': 'ဝင်ငွေကို ပြင်ပြီးပါပြီ။',
  'Income added successfully.': 'ဝင်ငွေ ထည့်ပြီးပါပြီ။',
  'Income deleted successfully.': 'ဝင်ငွေ ဖျက်ပြီးပါပြီ။',
  'Unable to delete income. Please try again.': 'ဝင်ငွေကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Category updated successfully.': 'အမျိုးအစားကို ပြင်ပြီးပါပြီ။',
  'Category added successfully.': 'အမျိုးအစား ထည့်ပြီးပါပြီ။',
  'Category deleted successfully.': 'အမျိုးအစား ဖျက်ပြီးပါပြီ။',
  'Unable to delete category. Please try again.': 'အမျိုးအစားကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Budget updated successfully.': 'ဘတ်ဂျက်ကို ပြင်ပြီးပါပြီ။',
  'Budget added successfully.': 'ဘတ်ဂျက် ထည့်ပြီးပါပြီ။',
  'Budget deleted successfully.': 'ဘတ်ဂျက် ဖျက်ပြီးပါပြီ။',
  'Unable to delete budget. Please try again.': 'ဘတ်ဂျက်ကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Recurring expense updated.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ပြင်ပြီးပါပြီ။',
  'Recurring expense added.': 'ထပ်တလဲလဲ အသုံးစရိတ် ထည့်ပြီးပါပြီ။',
  'Recurring expense paused.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ရပ်ထားပါပြီ။',
  'Recurring expense resumed.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ပြန်ဖွင့်ပါပြီ။',
  'Unable to update recurring expense. Please try again.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ပြင်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Recurring expense deleted.': 'ထပ်တလဲလဲ အသုံးစရိတ် ဖျက်ပြီးပါပြီ။',
  'Unable to delete recurring expense. Please try again.': 'ထပ်တလဲလဲ အသုံးစရိတ်ကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Notification marked as read.': 'အသိပေးချက်ကို ဖတ်ပြီးဟု မှတ်ပြီးပါပြီ။',
  'Unable to update the notification. Please try again.': 'အသိပေးချက်ကို ပြင်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'All notifications marked as read.': 'အသိပေးချက် အားလုံးကို ဖတ်ပြီးဟု မှတ်ပြီးပါပြီ။',
  'Unable to update the notifications. Please try again.': 'အသိပေးချက်များကို ပြင်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Notification deleted.': 'အသိပေးချက် ဖျက်ပြီးပါပြီ။',
  'Unable to delete the notification. Please try again.': 'အသိပေးချက်ကို ဖျက်၍ မရပါ။ ထပ်ကြိုးစားပါ။',
  'Settings saved.': 'ဆက်တင် သိမ်းပြီးပါပြီ။',
  'A budget already exists for this category and month.': 'ဤအမျိုးအစားနှင့် လအတွက် ဘတ်ဂျက် ရှိပြီးသားဖြစ်သည်။',
  'A category with this name already exists.': 'ဤအမည်ဖြင့် အမျိုးအစား ရှိပြီးသားဖြစ်သည်။',
  'Too many expenses to export. Narrow the filters and try again.': 'ထုတ်ရန် အသုံးစရိတ် များလွန်းသည်။ စစ်ထုတ်ချက်ကို ကျဉ်းပြီး ထပ်ကြိုးစားပါ။',
  'Account not found.': 'အကောင့် မတွေ့ပါ။',
  'Too many attempts. Please try again later.': 'ကြိုးစားမှု များလွန်းသည်။ နောက်မှ ထပ်ကြိုးစားပါ။',
  'Frequency must be weekly, monthly, or yearly': 'ကြိမ်နှုန်းသည် အပတ်စဉ်၊ လစဉ် သို့မဟုတ် နှစ်စဉ် ဖြစ်ရမည်',
  'Payment method is not supported': 'ဤငွေပေးချေမှုကို မပံ့ပိုးပါ',
  'Month must be between 1 and 12': 'လသည် ၁ မှ ၁၂ အတွင်း ဖြစ်ရမည်',
  'Date range must be 5 years or shorter': 'ရက်စွဲအပိုင်းအခြားသည် ၅ နှစ် သို့မဟုတ် ပိုတိုရမည်',
  'Expense not found': 'အသုံးစရိတ် မတွေ့ပါ',
  'Income not found': 'ဝင်ငွေ မတွေ့ပါ',
  'Category not found': 'အမျိုးအစား မတွေ့ပါ',
  'Budget not found': 'ဘတ်ဂျက် မတွေ့ပါ',
  'Recurring expense not found': 'ထပ်တလဲလဲ အသုံးစရိတ် မတွေ့ပါ',
  'Notification not found': 'အသိပေးချက် မတွေ့ပါ',
  'Profile not found': 'ပရိုဖိုင် မတွေ့ပါ',
  'Route not found.': 'လမ်းကြောင်း မတွေ့ပါ။',
  Utensils: 'ဇွန်းခရင်း',
  Car: 'ကား',
  House: 'အိမ်',
  Zap: 'လျှပ်စစ်',
  'Shopping bag': 'စျေးဝယ်အိတ်',
  Clapperboard: 'ရုပ်ရှင်',
  Heart: 'နှလုံး',
  'Graduation cap': 'ဘွဲ့ထုပ်',
  User: 'လူ',
  Coffee: 'ကော်ဖီ',
  Gift: 'လက်ဆောင်',
  Plane: 'လေယာဉ်',
  Briefcase: 'အိတ်',
  Music: 'ဂီတ',
  Book: 'စာအုပ်',
  Phone: 'ဖုန်း',
  Wifi: 'ဝိုင်ဖိုင်',
  Shirt: 'အင်္ကျီ',
  Landmark: 'အဆောက်အဦ',
  Dumbbell: 'အလေး',
  Film: 'ရုပ်ရှင်',
  Game: 'ဂိမ်း',
  Savings: 'စုဆောင်းငွေ',
  Baby: 'ကလေး',
  Dog: 'ခွေး',
  Fuel: 'လောင်စာ',
  Bus: 'ဘတ်စ်ကား',
  Wallet: 'ပိုက်ဆံအိတ်',
  Expense: 'အသုံးစရိတ်',
  January: 'ဇန်နဝါရီ',
  February: 'ဖေဖော်ဝါရီ',
  March: 'မတ်',
  April: 'ဧပြီ',
  May: 'မေ',
  June: 'ဇွန်',
  July: 'ဇူလိုင်',
  August: 'သြဂုတ်',
  September: 'စက်တင်ဘာ',
  October: 'အောက်တိုဘာ',
  November: 'နိုဝင်ဘာ',
  December: 'ဒီဇင်ဘာ',
};

const MONTHS = [
  ['January', 'ဇန်နဝါရီ'],
  ['February', 'ဖေဖော်ဝါရီ'],
  ['September', 'စက်တင်ဘာ'],
  ['October', 'အောက်တိုဘာ'],
  ['November', 'နိုဝင်ဘာ'],
  ['December', 'ဒီဇင်ဘာ'],
  ['August', 'သြဂုတ်'],
  ['March', 'မတ်'],
  ['April', 'ဧပြီ'],
  ['June', 'ဇွန်'],
  ['July', 'ဇူလိုင်'],
  ['May', 'မေ'],
  ['Jan', 'ဇန်'],
  ['Feb', 'ဖေ'],
  ['Mar', 'မတ်'],
  ['Apr', 'ဧပြီ'],
  ['Jun', 'ဇွန်'],
  ['Jul', 'ဇူ'],
  ['Aug', 'သြ'],
  ['Sep', 'စက်'],
  ['Oct', 'အောက်'],
  ['Nov', 'နို'],
  ['Dec', 'ဒီ'],
];

export function getLanguage() {
  return language;
}

export function setLanguage(value) {
  const next = value === 'my' ? 'my' : 'en';

  if (next === language) {
    return;
  }

  language = next;
  localStorage.setItem(STORAGE_KEY, next);
  applyLanguage(next);
  listeners.forEach((listener) => listener());
}

export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

export function translatePhrase(text) {
  if (text == null || text === '') {
    return '';
  }

  const value = String(text);

  if (language === 'en') {
    return value;
  }

  const trimmed = value.trim();
  const known = PHRASES[trimmed];

  if (known) {
    return known;
  }

  if (depth > 0) {
    return value;
  }

  depth += 1;

  try {
    const patterned = translatePattern(trimmed);

    if (patterned) {
      return patterned;
    }

    const withMonths = localizeMonths(trimmed);
    return withMonths === trimmed ? value : withMonths;
  } finally {
    depth -= 1;
  }
}

export function dateFormatHint(example) {
  if (language === 'my') {
    return `ဥပမာ: ${example}။ စာရင်းများတွင် ယနေ့နှင့် မနေ့ကို စာသားဖြင့် ပြသည်။`;
  }

  return `Example: ${example}. Today and yesterday stay labeled in lists.`;
}

export function pageLabel(page, total) {
  if (language === 'my') {
    return `စာမျက်နှာ ${page} / ${total}`;
  }

  return `Page ${page} of ${total}`;
}

function translatePattern(text) {
  let match = text.match(/^You have used (\d+)% of your (.+) budget\.$/);

  if (match) {
    const target = match[2] === 'monthly' ? 'လစဉ် ဘတ်ဂျက်' : `${translatePhrase(match[2])} ဘတ်ဂျက်`;
    return `${target} ၏ ${match[1]}% ကို သုံးပြီးပါပြီ။`;
  }

  match = text.match(/^(.+) is due today\.$/);

  if (match) {
    return `${match[1]} သည် ယနေ့ ပေးရန် ဖြစ်သည်။`;
  }

  match = text.match(/^(.+) was due on (.+)\.$/);

  if (match) {
    return `${match[1]} သည် ${localizeMonths(match[2])} တွင် ပေးရန် ကျော်လွန်ခဲ့သည်။`;
  }

  match = text.match(/^(.+) is due on (.+)\.$/);

  if (match) {
    return `${match[1]} သည် ${localizeMonths(match[2])} တွင် ပေးရန် ဖြစ်သည်။`;
  }

  match = text.match(/^Your (.+) report is ready\. Income (.+), expenses (.+)\.$/);

  if (match) {
    return `${localizeMonths(match[1])} အစီရင်ခံစာ အသင့်ဖြစ်ပါပြီ။ ဝင်ငွေ ${match[2]}၊ အသုံးစရိတ် ${match[3]}။`;
  }

  match = text.match(/^Your (.+) spending is (\d+)% (higher|lower) than last month\.$/);

  if (match) {
    const direction = match[3] === 'higher' ? 'များ' : 'နည်း';
    return `${translatePhrase(match[1])} အသုံးစရိတ်သည် ယခင်လထက် ${match[2]}% ${direction}သည်။`;
  }

  match = text.match(/^(.+) is (.+), higher than your other expenses this month\.$/);

  if (match) {
    const name = match[1] === 'An expense' ? 'အသုံးစရိတ် တစ်ခု' : match[1];
    return `${name} သည် ${match[2]} ဖြစ်ပြီး ဤလ၏ အခြားအသုံးစရိတ်များထက် များသည်။`;
  }

  match = text.match(/^(.+) is your largest category this month, at (.+)\.$/);

  if (match) {
    return `${translatePhrase(match[1])} သည် ဤလတွင် အကြီးဆုံး အမျိုးအစားဖြစ်ပြီး ${match[2]} ဖြစ်သည်။`;
  }

  match = text.match(/^(.+) is your second-largest category this month\.$/);

  if (match) {
    return `${translatePhrase(match[1])} သည် ဤလတွင် ဒုတိယ အကြီးဆုံး အမျိုးအစား ဖြစ်သည်။`;
  }

  match = text.match(/^Your average daily spending is (.+)\.$/);

  if (match) {
    return `တစ်ရက်ပျမ်းမျှ အသုံးစရိတ်သည် ${match[1]} ဖြစ်သည်။`;
  }

  match = text.match(/^(Good morning|Good afternoon|Good evening), (.+)$/);

  if (match) {
    const part = {
      'Good morning': 'မင်္ဂလာ မနက်ခင်းပါ',
      'Good afternoon': 'မင်္ဂလာ နေ့လည်ပါ',
      'Good evening': 'မင်္ဂလာ ညနေပါ',
    }[match[1]];
    return `${part}၊ ${match[2]}`;
  }

  match = text.match(/^(.+) over budget$/);

  if (match) {
    return `${match[1]} ဘတ်ဂျက်ကျော်`;
  }

  match = text.match(/^(.+) remaining$/);

  if (match) {
    return `${match[1]} ကျန်သည်`;
  }

  match = text.match(/^Spent (.+)$/);

  if (match) {
    return `ကုန်ကျ ${match[1]}`;
  }

  match = text.match(/^(.+) this month$/);

  if (match) {
    return `${match[1]} ဤလ`;
  }

  match = text.match(/^(\d+) expense$/);

  if (match) {
    return `အသုံးစရိတ် ${match[1]} ခု`;
  }

  match = text.match(/^(\d+) expenses$/);

  if (match) {
    return `အသုံးစရိတ် ${match[1]} ခု`;
  }

  match = text.match(/^(\d+) income record$/);

  if (match) {
    return `ဝင်ငွေ ${match[1]} ခု`;
  }

  match = text.match(/^(\d+) income records$/);

  if (match) {
    return `ဝင်ငွေ ${match[1]} ခု`;
  }

  match = text.match(/^Income (.+), expenses (.+)$/);

  if (match) {
    return `ဝင်ငွေ ${match[1]}၊ အသုံးစရိတ် ${match[2]}`;
  }

  match = text.match(/^Notifications, (\d+) unread$/);

  if (match) {
    return `အသိပေးချက်၊ မဖတ်ရသေး ${match[1]} ခု`;
  }

  match = text.match(/^Edit (.+)$/);

  if (match) {
    return `${translatePhrase(match[1])} ပြင်ရန်`;
  }

  match = text.match(/^Delete (.+)$/);

  if (match) {
    return `${translatePhrase(match[1])} ဖျက်ရန်`;
  }

  match = text.match(/^Color (.+)$/);

  if (match) {
    return `အရောင် ${match[1]}`;
  }

  match = text.match(/^(.+) budget (\d+)% used, (.+)$/);

  if (match) {
    return `${translatePhrase(match[1])} ဘတ်ဂျက် ${match[2]}% သုံးပြီး၊ ${translatePhrase(match[3])}`;
  }

  match = text.match(/^(\d+)% used$/);

  if (match) {
    return `${match[1]}% သုံးပြီး`;
  }

  match = text.match(/^Next (.+)$/);

  if (match) {
    return `နောက် ${match[1]}`;
  }

  return '';
}

function localizeMonths(text) {
  return MONTHS.reduce(
    (current, [english, burmese]) => current.replaceAll(english, burmese),
    text,
  );
}

function readLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'my' ? 'my' : 'en';
  } catch {
    return 'en';
  }
}

function applyLanguage(value) {
  document.documentElement.lang = value === 'my' ? 'my' : 'en';
}
