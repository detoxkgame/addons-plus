# -*- coding: utf-8 -*-

{
    'name': 'Odoo12 All-in-one Accounting reports',
    'version': '1.0',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 125,
    'currency': 'EUR',
    'description': """
            This module helps to generate all Accounting Reports in PDF, Assets Managements and Bank Reconciliation report
    """,
    'category': 'Accounting',
    'images': ['images/main_screenshot.png'],
    'depends': ['base', 'account','skit_financial_form','skit_account_reports','skit_asset_management','skit_bank_reconcil'],
   
    'auto_install': False,
    'application': True,
    'installable': True,
}
