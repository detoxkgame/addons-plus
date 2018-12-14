# -*- coding: utf-8 -*-

{
    'name': 'Odoo12 Financial Reports in PDF',
    'version': '1.1',
    'summary': 'This module helps to generate Financial reports Balance Sheet, Profit and Loss, Trial Balance, General Ledger and Aged Partner Balance in PDF format',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 75,
    'currency': 'EUR',
    'description': """
        This module helps to generate Financial reports Balance Sheet, Profit and Loss, Trial Balance, General Ledger and Aged Partner Balance in PDF format
        """,
    'images': ['images/main_screenshot.png'],
    'category': "Invoicing Management",
    'depends': ['account','skit_financial_form'],
    'data': [
        'views/account_menuitem.xml',
        'views/account_report.xml',
        'wizard/account_report_trial_balance_view.xml',        
        'views/report_trialbalance.xml',
        'wizard/account_report_general_ledger_view.xml',
        'views/report_generalledger.xml',
        'wizard/account_financial_report_view.xml',
        'views/report_financial.xml',
        'wizard/account_report_aged_partner_balance_view.xml',        
        'views/report_agedpartnerbalance.xml',
        
    ],
    'installable': True,    
    'auto_install': False,
    'application': True,
}
