# -*- coding: utf-8 -*-

from odoo import api,models


class custom_rep(models.TransientModel):
    
    _inherit = "account.report.general.ledger"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);
custom_rep()

class custom_bal(models.TransientModel):
    
    _inherit = "account.balance.report"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

 
custom_bal()

class custom_account(models.TransientModel):
    
    _inherit = "accounting.report"
    @api.multi
    def check_report_xlsx(self):
        res = super(custom_account, self).check_report()
        res['data']['skit_report_type'] = "XLS"        
        res['data']['skit_currency'] = self.env.user.currency_id.symbol 
        return res


custom_account()

class custom_aged(models.TransientModel):

    _inherit = "account.aged.trial.balance"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_aged()

class custom_patner(models.TransientModel):

    _inherit = "account.report.partner.ledger"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_patner()

class custom_tax(models.TransientModel):

    _inherit = "account.tax.report"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_tax()

class custom_audit(models.TransientModel):

    _inherit = "account.print.journal"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_audit()

from odoo.addons import web
import json
import time
from werkzeug import exceptions, url_decode
from werkzeug.datastructures import Headers
from werkzeug.test import Client
from werkzeug.wrappers import BaseResponse

from odoo.http import Controller, route, request
from odoo.tools import html_escape
from odoo.addons.web.controllers.main import _serialize_exception, content_disposition
from odoo.tools.safe_eval import safe_eval
from bs4 import BeautifulSoup
import xlwt
from io import BytesIO
import re
class ReportControllerDerived(web.controllers.main.ReportController):

    @route(['/report/download'], type='http', auth="user")
    def report_download(self, data, token):
      
        requestcontent = json.loads(data)
        
        url, type = requestcontent[0], requestcontent[1]
        try:
            if type == 'qweb-pdf':
                reportname = url.split('/report/pdf/')[1].split('?')[0]
                docids = None
                if '/' in reportname:
                    reportname, docids = reportname.split('/')

                if docids:
                    # Generic report:
                    response = self.report_routes(reportname, docids=docids, converter='pdf')
                else:
                    # Particular report:
                    data = url_decode(url.split('?')[1])# decoding the args represented in JSON
                    response = self.report_routes(reportname, converter='pdf', **dict(data))
                    temp_dict = {}
                    temp_dict.update(json.loads(dict(data).pop('options')))
                    
                    
                    
                    if 'skit_report_type' in temp_dict.keys()  and  temp_dict['skit_report_type'] == 'XLS':
                        report = request.env['ir.actions.report']._get_report_from_name(reportname)
                        filename = "%s.%s" % (report.name, "xls")
                        # Customize the report name must be what we want
                        # from print xls report ,pass the report_name and customize it.
                        # code added for skit.event.report module execute same model for all event report
                        if 'report_name' in temp_dict.keys()  and  temp_dict['skit_report_type'] == 'XLS':
                            filename = "%s.%s" % (temp_dict['report_name'], "xls")
                        response.headers.add('Content-Disposition', content_disposition(filename))
                        response.set_cookie('fileToken', token)
                        return response

                report = request.env['ir.actions.report']._get_report_from_name(reportname)
                filename = "%s.%s" % (report.name, "pdf")
                response.headers.add('Content-Disposition', content_disposition(filename))
                response.set_cookie('fileToken', token)
                return response
            elif type == 'controller':
                reqheaders = Headers(request.httprequest.headers)
                response = Client(request.httprequest.app, BaseResponse).get(url, headers=reqheaders, follow_redirects=True)
                response.set_cookie('fileToken', token)
                return response
            else:
                return
        except Exception as e:
            se = _serialize_exception(e)
            error = {
                'code': 200,
                'message': "Odoo Server Error",
                'data': se
            }
            return request.make_response(html_escape(json.dumps(error)))


    @route([
        '/report/<path:converter>/<reportname>',
        '/report/<path:converter>/<reportname>/<docids>',
    ], type='http', auth='user', website=True)
    def report_routes(self, reportname, docids=None, converter=None, **data):
        report_obj = request.env['ir.actions.report']._get_report_from_name(reportname)
        context = dict(request.env.context)

        if docids:
            docids = [int(i) for i in docids.split(',')]
       
        if data.get('options'):
            data.update(json.loads(data.pop('options')))
        if data.get('context'):
            # Ignore 'lang' here, because the context in data is the one from the webclient *but* if
            # the user explicitely wants to change the lang, this mechanism overwrites it.
            data['context'] = json.loads(data['context'])
            if data['context'].get('lang'):
                del data['context']['lang']
            context.update(data['context'])

        if ('skit_report_type' in data.keys() and  data['skit_report_type'] == 'XLS'):
            html = report_obj.with_context(context).render_qweb_html(docids, data=data)[0]
            wb = xlwt.Workbook(encoding="UTF-8", style_compression=2)
            ws = wb.add_sheet('report')
            # f = urllib.urlopen(
            #    "http://www.ebi.ac.uk/Tools/services/web/blastresult.ebi?tool=ncbiblast&jobId=ncbiblast-I20120714-161017-0108-80986175-pg&context=nucleotide")
            # html = f.read()
            soup = BeautifulSoup(html,'html.parser')
            # print soup.prettify()
            # print soup
            x = 0
            h2 = soup.find(lambda elm: elm.name == "h2")
            h3 = soup.find(lambda elm: elm.name == "h3")
         
            if(h2):
                ws.write_merge(x, 0, 0, 7, str(h2.text), xlwt.easyxf('font:height 300, bold True, name Arial; align: horiz center, vert center;borders: top medium,right medium,bottom medium,left medium'))
            elif(h3):
                ws.write_merge(x, 0, 0, 7, str(h3.text), xlwt.easyxf('font:height 300, bold True, name Arial; align: horiz center, vert center;borders: top medium,right medium,bottom medium,left medium'))
           
            font2 = xlwt.easyfont('bold true')
            currency_style = xlwt.XFStyle()
            currency_style.num_format_str = "#,##0.00"
            # Set font style to Bold only for TH tag
            currency_style_bold = xlwt.XFStyle()
            currency_style_bold.num_format_str = "#,##0.00"
            borders = xlwt.Borders()
            borders.top = xlwt.Borders.THICK
            borders.bottom = xlwt.Borders.THICK
            #num_format = xlwt.easyxf("", "#,##0.00")
            # num_format.alignment = "right"
            # num_format.num_format = "#,###.00"
            div_row = soup.findAll("div", {"class": "row"})
            if (h2 != None and h2.text == 'Profit and Loss') or  reportname == 'skit_financial_report.report_agedpartnerbalance_detail':
                report_div = soup.findAll("span", {"class": "Reportrundate"})
                for report_datetime in report_div:
                    txt = 'As of '+report_datetime.text
                    ws.write(1, 3, txt, xlwt.easyxf('font:bold True'))
            for div in div_row:
                left_col = div.findAll("div", {"class":["col-xs-4", "col-xs-3","col-4","col-3"]})
                x = x + 1
                y = 0
                for div_col in left_col:

                    strong = div_col.findAll("strong")
                    p = div_col.findAll("p")
                    span = div_col.findAll("span")
                    for i in range(len(strong)):
                        if (strong[i] != None and len(p) > 0 and len(span) == 0):
                            ws.write_rich_text(x, y, ((strong[i].text, font2), "   ", p[i].text))
                            y = y + 1
                        elif (strong[i] != None and len(span) > 0):
                            ws.write_rich_text(x, y, ((strong[i].text, font2), "   ", span[i].text))
                            y = y + 1
                    # print(div_col.find("strong").text)
                    # print(div_col.find("p"))
                    # y = y + 1

            table = soup.find("table")
            rows = table.findAll("tr")
            x = x + 2
            h = 0
            for tr in rows:
                style = xlwt.easyxf('font:bold False')
                if "style" in tr.attrs:
                    if (tr['style'] == 'font-weight: bold;'):
                        style = xlwt.easyxf('font:bold True')
                header = tr.findAll("th")
                y = 0
                if (len(header) > 0):
                    if (h == 0):
                        for th in header:
                            if reportname == 'skit_financial_report.report_agedpartnerbalance_detail':
                                # Set font style to Bold only for TH tag
                                currency_style_bold.font = font2
                                texte_bu = th.text
                                if(texte_bu == 'Total '.decode('utf-8')):
                                    texte_bu = '.....Total'
                                # To print currency value in right side of a column
                                if th.has_attr('class') and th['class'][0] == 'display_currency_format':
                                    if th.has_attr('groups') and th['groups'] == "base.group_multi_currency":
                                        span_curr = th.findAll('span')
                                        texte_bu = span_curr[0].text
                                    texte_bu = texte_bu.replace(data['skit_currency'], '')
                                    if (len(texte_bu) > 0):
                                        ws.write(x, y, float(float(re.sub(r'[^0-9.-]', '', texte_bu))), currency_style_bold)
                                    else:
                                        ws.write(x, y, texte_bu, currency_style_bold)
                                else:
                                    if(texte_bu == 'Total'):
                                        ws.write(x, y, texte_bu, xlwt.easyxf('font:bold True; align: horiz right'))
                                    else:
                                        ws.write(x, y, texte_bu, xlwt.easyxf('font:bold True'))
                            else:
                                ws.write(x, y, th.text, xlwt.easyxf('font:bold True'))
                                h = h + 1
                            y = y + 1
                        x = x + 1
                y = 0
                cols = tr.findAll("td")

                if not cols:
                    # when we hit an empty row, we should not print anything to the workbook
                    continue
                
                for td in cols:
                    border_line_style = xlwt.XFStyle()
                    if "style" in tr.attrs:
                        if (tr['style'] == 'font-weight: bold;'):
                            border_line_style.font = font2
                    texte_bu = td.text
                    
                    if (reportname == 'skit_website_deity_lights.report_print_dl_birthdayreport') or (reportname == 'skit_event_report.report_deity_event') or (reportname == 'skit_event_report.report_cny_event') or (reportname == 'skit_event_report.report_puja_event') or (reportname == 'skit_event_report.report_gr_event') or (reportname == 'skit_event_report.report_hf_event'):
                        texte_bu = td.text
                    else:
                        texte_bu = texte_bu.replace("\n","").replace("‑","-")
                    if (("style" in td.attrs) and (td['style'] == 'border-bottom: 2px solid; border-top: 2px solid;')):
                                border_line_style.borders = borders
                                currency_style.borders = borders
                    else:
                            borders1 = xlwt.Borders()
                            borders1.top = xlwt.Borders.NO_LINE
                            borders1.bottom = xlwt.Borders.NO_LINE
                            border_line_style.borders = borders1
                            currency_style.borders = borders1
                    texte_bu = texte_bu.strip()
                    if td.has_attr('class') and td['class'][0] == 'text-right':
                        span_curr1 = td.findAll('span')
                        if span_curr1[0].has_attr('class') and span_curr1[0]['class'][0] == 'set_bracket':
                                currency_style.num_format_str= "(#,##0.00)"
                        else:
                            currency_style.num_format_str= "#,##0.00"
                        if td.has_attr('groups') and td['groups'] == "base.group_multi_currency":
                            span_curr = td.findAll('span')
                            texte_bu = span_curr[0].text
                        texte_bu = texte_bu.replace(data['skit_currency'], '')
                        if (len(texte_bu) > 0):
                            ws.write(x, y, float(float(re.sub(r'[^0-9.-]', '', texte_bu))), currency_style)
                        else:
                            ws.write(x, y, texte_bu, currency_style)
                    else:
                        ws.write(x, y, texte_bu, border_line_style)
                    # print(x, y, td.text)
                    if "colspan" in td.attrs:
                        y = y + int(td['colspan']) - 1
                    y = y + 1
                # update the row pointer AFTER a row has been printed
                # this avoids the blank row at the top of your table
                x = x + 1
            fp = BytesIO()
            wb.save(fp)
            fp.seek(0)
            data = fp.read()
            fp.close()
            
            pdfhttpheaders = [('Content-Type','application/vnd.ms-excel')]
            return request.make_response(data, headers=pdfhttpheaders)

        elif converter == 'html':
            html = report_obj.with_context(context).render_qweb_html(docids, data=data)[0]
            return request.make_response(html)
        elif converter == 'pdf':
            pdf = report_obj.with_context(context).render_qweb_pdf(docids, data=data)[0]
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        else:
            raise exceptions.HTTPException(description='Converter %s not implemented.' % converter)
