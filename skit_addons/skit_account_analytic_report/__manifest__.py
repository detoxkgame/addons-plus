# -*- encoding: utf-8 -*-
# © 2016 Samuel Lefever, Jerome Sonnet
# © 2016 Niboo SPRL (<https://www.niboo.be/>), Be-Cloud
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl.html).

{
    'name': 'Filter Financial reports by Analytic Account',
    'version': '1.0',
    'category': 'Accounting',
    'summary': 'Filter Financial reports by Analytic Account',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'description': """
            This module allows you to  filter Financial Reports by analytic account.

    """,
    'website': 'http://www.srikeshinfotech.com',
    'price'  : 45,
    'currency': 'EUR',    
    'images': ['images/main_screenshot.png'],
    'data': [
        'views/account_analytic_filter.xml',     
        'views/general_ledger_account_analytic.xml',        
    ],
    'depends': [
        'account','skit_account_reports'
    ],
    'installable': True,
    'application': False,
}