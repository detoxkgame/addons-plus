from odoo import fields, models
from datetime import datetime, timedelta

 
class ProductHistory(models.Model):
    """ Product history"""
    
    _name ='product.history'
    _description ='Maintain Product history'
    
    
    product_id = fields.Many2one('product.product', string='Product id', ondelete='cascade')
    product_tmpl_id = fields.Many2one('product.template', string='Product template id', ondelete='cascade')
    date = fields.Datetime(string=' Date')
    order_id = fields.Many2one('product.product', string='Product id', ondelete='cascade')
    status = fields.Char(string='status')
    created_by = fields.Many2one('res.users', string='Created user', ondelete='cascade')
    state = fields.Selection(
        [('draft', 'New'),('reserved', 'Reserved'),('noshow', 'No show'), ('checkin', 'CheckIn'),('checkout', 'CheckOut'),('cancel', 'Cancelled'), ('paid', 'Paid'), ('done', 'Posted'), ('invoiced', 'Invoiced')],
        'Status',  copy=False, default='draft')

 
class Producttemplate(models.Model): 
    _inherit='product.template'
    
    product_history_line_ids = fields.One2many('product.history', 'product_tmpl_id', string='Product template history')
    room_status = fields.Char(string='status')
    
 
class RoomStatus(models.Model):
    """Room Status"""
  
    _inherit = 'product.template'
    _description = "Status of the Rooms"
 
     
    def get_roomstatus(self, from_date, to_date):
 
        N = 2
        
        date_array=[]      
        if(from_date and to_date):
            from_date = datetime.strptime(from_date, '%m/%d/%Y')
            to_date = datetime.strptime(to_date, '%m/%d/%Y')
            d1 = from_date.date()  # start date
            d2 = to_date.date()  # end date
            delta = d2 - d1         # timedelta
            N = delta.days + 1

        product_history_ids_list = self.env['product.history'].sudo().search([])
        list_product_array = {}
        room_status_list_array = {}        
        if product_history_ids_list:
                for history in product_history_ids_list:
                    product = history.product_id.id
                    product_arr =  self.env['product.product'].sudo().search([('id','=',product)])
                    rowdate = ""+datetime.strftime(history.date, "%b %d %Y")#""+history.date.strftime('%Y-%m-%d %H:%M:%S')
                    key = str(product)+"-"+rowdate
                    room_status_list_array[key] = history.state
                    list_product_array[product] = product_arr.name
                    
        
        for i in range(N):
            if from_date and to_date:
                range_date = from_date + timedelta(i)
            else:
                range_date = datetime.now() - timedelta(i)
            date = datetime.strftime(range_date, "%b %d %Y")            
            date_array.append(date)
        
        return {'date_key':date_array,'room_status_list_array':room_status_list_array,'list_product_array':list_product_array}
