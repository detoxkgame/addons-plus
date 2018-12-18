# -*- coding: utf-8 -*-

{
    'name': 'Financial Report Pivot',
    'version': '1.1',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'summary': 'Pivot view for Profit & Loss and Balance Sheet Report',
    'description': """
            Pivot view for Profit & Loss and Balance Sheet Report
    """,
    'price': 35,
    'currency': 'EUR',
    'category': 'Accounting',
    'images': ['images/main_screenshot.png'],
    'depends': ['account','skit_financial_form'],
    'data': [
            'views/account_menus.xml',
            'views/profit_loss_report_view.xml',
            'views/balance_sheet_report_view.xml',
            'security/ir.model.access.csv',
            ],
    'auto_install': False,
    'application': True,
    'installable': True,
}
